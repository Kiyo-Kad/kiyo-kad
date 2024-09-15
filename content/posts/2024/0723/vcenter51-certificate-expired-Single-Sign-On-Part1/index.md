---
title: vCenter 5.1 証明書期限切れ対応(Single Sign On)(Part1)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(Single Sign On)(Part1)
date: 2024-07-23T17:05:00+09:00
tags: ["vcenter5.1", "certificate expried", "SSO", "Single Sign On"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(SSO: Single Sign On)(Part1)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">SSO (vCenter Single Sign On)(Part1)</span>
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. [Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_blank"}
1. [vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_blank"}
1. [vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_blank"}
1. [vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_blank"}
1. Update Manager (未確認…本環境ではインストールしていません)
:::

### ■確認事項
::: info ※以下確認してください
+ 時間は戻っていますか？
+ vCenter Server 系のサービス起動中ですか？
:::


## vCenter 5.1.0 の証明書の更新には順番がある

### ■参照リンクから基本部分は引用

***[vCenter 5.1 U1 Install: Part 2 (Create vCenter SSL Certificates)](https://www.derekseaman.com/2012/09/vmware-vcenter-51-installation-part-2.html)***
<p>&nbsp;</p>

#### 参照元に記載されている要点をまとめてみる

+ VMware KBs （VMware Knowledge Base: 知識ベース）によれば、trusted SSL certificates (信頼された SSL 証明書)には、***key Usage: Data Endpherment*** が必要  
　<span style="color: #f0f;">※別に無くても証明書の関連サービスの更新は完了する。</span> ただし、***vCO (vCenter Orchestrator)*** を利用しない場合に限る  
　※ここでは、すべてのサービス( Update Manager 除く）が、全てを動作するようにするため、***Data Endpherment*** を設定する  
　<br />
　※ ***Data encipherment*** は、暗号化キーではなくパブリックキーを使用してユーザーデータを暗号化する場合に有効にする

+ 単一の SSL 証明書では機能しません。これは、様々なコンポーネント（Inventrory Service, vCenter など）が SSO サービスに登録（連携）しているため  
　***<mark>※SSO を含む複数のサービス毎に、証明書を順を追って更新していく必要がある</mark>***

+ 自己認証局に、***Microsoft CA*** を利用する場合、***Data Endpherment*** の項目がない。しかしながら、vmwareの現在の見解では、この key Usage: Data Endpherment は、必要としている（前述）  
　<br />
　<span style="color: #f00;">※開発環境で、***Microsoft CA (MSCA)*** の構築にトライしたが、問題が発生した（→後述）。調べるとOSは ***Enterprise*** である必要があるらしい  
　<br />
　※加えて CA の構築には、 ***Active Directory*** の設定が必須とのこと  
　→Server 2016 Standard で構築してみたが、以下のリンクにある「テンプレート(VMware SSL)」を設定しても、CA のWEBサイトでは、 ***『(VMware SSL) 選択肢に出てこない』*** 事象が発生する</span>  
　<br />
　→***[Create Windows CA VMware Certificate Template](https://www.derekseaman.com/2012/09/create-vmware-windows-ca-certificate.html)***

::: danger 以下の手順で期限切れの証明書を更新完了
本手順では、 ***OpenSSL 0.98*** で、署名して新たな証明を作成する手順で、すべて手動で更新することができた
:::

リンク先の情報を見るとわかるが、すでに現時点（2024/07/23）で１０年以上前の記事になる。
しかしながら、長期にわたりこのバージョンを利用しなければ、証明書が期限切れになることもなかったであろう。
最も、”謎解きパズル”的な貴重な体験（手順）になったので、備忘録的に残しておくことにした。  
もし更新に困った方がいれば、参照元も含め、ご利用いただけると嬉しい。  
　<br />
では、以下から更新手順のメインに入っていく。

## 7つのサービス用の証明書を作成する

証明書を置くフォルダを作成する。

```
mkdir C:\Certs
cd /d C:\Certs
```

次の内容を [1]setup_folder.bat として作成して、C:\Certs に設置してください。

```
Set Cert_Path=C:\Certs
mkdir %Cert_Path%\vCenter\
mkdir %Cert_Path%\Inventory\
mkdir %Cert_Path%\SSO\
mkdir %Cert_Path%\UpdateManager\
mkdir %Cert_Path%\WebClient\
mkdir %Cert_Path%\LogBrowser\
mkdir %Cert_Path%\Orchestrator\
```
以下でフォルダを作成する
```
[1]setup_folder.bat
```


## Configuration File Creation

証明書署名要求(CSR)の元となる*.cfg を上記の各フォルダに作成する。  
<span style="color: #f00;">※***organizationalUnitName (OU)*** は同一にならないようにする</span>

###### Inventory.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = vCenterInventoryService
 commonName = VCS51.testdev.local
```

###### SSO.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = vCenterSSO
 commonName = VCS51.testdev.local
```

###### vCenter.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = vCenterServer
 commonName = VCS51.testdev.local
```

###### WebClient.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = vCenterWebClient
 commonName = VCS51.testdev.local
```

###### VUM.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = VMwareUpdateManager
 commonName = VCS51.testdev.local
```

###### LogBrowser.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = vCenterLogBrowser
 commonName = VCS51.testdev.local
```

###### Orchestrator.cfg
```
[ req ]
 default_bits = 2048
 default_keyfile = rui.key
 distinguished_name = req_distinguished_name
 encrypt_key = no
 prompt = no
 string_mask = nombstr
 req_extensions = v3_req

[ v3_req ]
 basicConstraints = CA:FALSE
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local

[ req_distinguished_name ]
 countryName = US
 stateOrProvinceName = California
 localityName = Palo Alto
 0.organizationName = VMware
 organizationalUnitName = VMwareOrchestrator
 commonName = VCS51.testdev.local
```

## Create CSRs （証明書署名要求[CSR]を作成）

次の内容を [2]Create_CSR.bat として作成して、C:\Certs に設置してください。

```
Set OpenSSL_BIN=C:\OpenSSL-Win32\bin\openssl.exe
Set Cert_Path=C:\Certs

CD /d %Cert_Path%\vcenter\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config vcenter.cfg

CD /d %Cert_Path%\Inventory\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config inventory.cfg

CD /d %Cert_Path%\SSO\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config SSO.cfg

CD /d %Cert_Path%\UpdateManager\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config VUM.cfg

CD /d %Cert_Path%\webclient\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config webclient.cfg

CD /d %Cert_Path%\LogBrowser\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config LogBrowser.cfg

CD /d %Cert_Path%\Orchestrator\
%OpenSSL_BIN% genrsa 2048 > rui.key
%OpenSSL_BIN% req -out rui.csr -key rui.key -new -config Orchestrator.cfg
```

以下で、暗号化キーとCSRを作成する
```
[2]Create_CSR.bat
cd /d C:\Certs
```

## 自己認証局で署名を行い、証明書を作成

中間認証局 (Intermediate Certificate Authority)にて署名する  
以下の内容で、***ext.cnf*** 拡張ファイルを作成し、C:\Certs\SSO に設置する

```
 basicConstraints = CA:FALSE
 nsCertType             = server
 nsComment              = "OpenSSL Generated Server Certificate"
 subjectKeyIdentifier   = hash
 authorityKeyIdentifier = keyid,issuer:always
 keyUsage = digitalSignature, keyEncipherment, dataEncipherment
 extendedKeyUsage = serverAuth, clientAuth
 subjectAltName = DNS:VCS51, IP:192.168.1.100, DNS:VCS51.testdev.local
```

以下７項目に順次サインする。  

環境変数の設定  

```
Set OpenSSL_BIN=C:\OpenSSL-Win32\bin\openssl.exe
Set Cert_Path=C:\Certs
set Extend_Conf=%Cert_Path%\SSO
```


###### vCenter
```
CD /d %Cert_Path%\vcenter\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```


（中間認証局）キーのパスワード (***testpassword***) を入力し、「証明書にサインしますか？」に「***y***」、「コミットしますか？」に「***y***」を入力する。  
できたら、次の署名に進む。

> .....  
> Enter pass phrase for C:\CA\intermediate\private\intermediate.key.pem: ***testpassword***  
> .....  
> Sign the certificate? [y/n]: ***y***  
> .....  
> 1 out of 1 certificate requests certified, commit? [y/n] ***y***  
>  
> Write out database with 1 new entries  
> writing new certificates  
> writing C:\CA\intermediate\newcerts/*****.pem  
> Data Base Updated  

　<br />


###### Inventory
```
CD /d %Cert_Path%\Inventory\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```

###### SSO
```
CD /d %Cert_Path%\SSO\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```

###### VUM
```
CD /d %Cert_Path%\UpdateManager\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```

###### webclient
```
CD /d %Cert_Path%\webclient\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```

###### LogBrowser
```
CD /d %Cert_Path%\LogBrowser\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```

###### Orchestrator
```
CD /d %Cert_Path%\Orchestrator\
%OpenSSL_BIN% ca -verbose -config c:\CA\intermediate\openssl.cfg -extfile %Extend_Conf%\ext.cnf -days 5000 -notext -md sha256 -in rui.csr -out rui.crt
```


## Creating PFX Files (パスワード付き証明書の作成)

次の内容を [3]Create_PFX.bat として作成して、C:\Certs に設置してください。


```
Set OpenSSL_BIN=C:\OpenSSL-Win32\bin\openssl.exe
Set Cert_Path=C:\Certs
:%OpenSSL_BIN% version

CD /d %Cert_Path%\SSO
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx
:%OpenSSL_BIN% pkcs12 -in rui.pfx -info

CD /d %Cert_Path%\Inventory
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx

CD /d %Cert_Path%\vCenter
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx

CD /d %Cert_Path%\UpdateManager
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx

CD /d %Cert_Path%\WebClient
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx

CD /d %Cert_Path%\LogBrowser
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx

CD /d %Cert_Path%\Orchestrator
%OpenSSL_BIN% pkcs12 -export -in rui.crt -inkey rui.key -certfile C:\CA\intermediate\certs\intermediate.cert.pem -name rui -passout pass:testpassword -out rui.pfx
```

以下で、PFXを作成する
```
[3]Create_PFX.bat
cd /d C:\Certs
```

証明書を表示する場合以下
```
CD /d %Cert_Path%\SSO
%OpenSSL_BIN% pkcs12 -in rui.pfx -info
```

以下のように ***testpassword*** と入力して、Enter を押す。

> Enter Import Password: ***testpassword***  
> ......  
> Enter PEM pass phrase: ***testpassword***  
> Verifying - Enter PEM pass phrase: ***testpassword***  
> -----BEGIN RSA PRIVATE KEY-----  
> ......  
> -----END RSA PRIVATE KEY-----  


## Root証明書と中間証明書のキーチェーンを作る

　『サービス用証明書＋中間証明書＋Root証明書』のファイルを結合し chain.pem ファイルとして作成可能だが、本手順では使わない。  
　（※chain.pem は、SSL Certificate Automation Tools 1.0 のツールで利用するファイルの為）

次の内容を [4]chain_pem.bat として作成して、C:\Certs に設置してください。
（※chain.pem の作成部分は、コメントアウトしてある）

```
Set Cert_Path=C:\Certs

copy C:\CA\root\certs\ca.cert.pem %Cert_Path%\Root64-1.cer
copy C:\CA\intermediate\certs\intermediate.cert.pem %Cert_Path%\Root64-2.cer

Set Root_CA_Cert=%Cert_Path%\Root64-1.cer
Set Sub_CA_Cert=%Cert_Path%\Root64-2.cer
Set CA_Chain=%Cert_Path%\Root.cer

if exist %Sub_CA_Cert% (
copy /B  %Sub_CA_Cert% + %Root_CA_Cert% %CA_Chain%
Set CA_Cert_Chain=%CA_Chain%
) Else (
Set CA_Cert_Chain=%Cert_Path%\root64.cer
)

:CD /d %Cert_Path%\SSO
:copy /B rui.crt + %CA_Cert_Chain% chain.pem
:CD /d %Cert_Path%\Inventory
:copy /B rui.crt + %CA_Cert_Chain% chain.pem
:CD /d %Cert_Path%\vCenter
:copy /B rui.crt + %CA_Cert_Chain% chain.pem
:CD /d %Cert_Path%\UpdateManager
:copy /B rui.crt + %CA_Cert_Chain% chain.pem
:CD /d %Cert_Path%\WebClient
:copy /B rui.crt + %CA_Cert_Chain% chain.pem
:CD /d %Cert_Path%\LogBrowser
:copy /B rui.crt + %CA_Cert_Chain% chain.pem
:CD /d %Cert_Path%\Orchestrator
:copy /B rui.crt + %CA_Cert_Chain% chain.pem

echo 次の処理利用のため、Root64.cer作成します。
copy %Cert_Path%\Root.cer %Cert_Path%\Root64.cer
```

以下で、 Root64.cer を作成する
```
[4]chain_pem.bat
cd /d C:\Certs
```


::: warning 補足 \: Root\**.cer ファイルの詳細
**Root64.cer** - 中間証明書 + ルート証明書のチェーンしたもの  
　(Root64-2.cer + Root64-1.cer)  
**Root.cer** - Root64.cer と同じ（ファイル名のみ異なるのみ）  
　※処理途中で Root64.cer を利用するため  
**Root64-1.cer** - ルート証明書 (単体）  
**Root64-2.cer** - 中間証明書（単体）  
:::


## Create JKS KeyStore
### (JKS キーストアを作成)

::: info ※Information
<span style="color: #f00;">　***ここからが、 SSL Certificate Automation Tools 1.0 が無いので、手動証明書更新のメインの手順になる***</span>  
:::


1. まずは、 SSO service が使う、空の JKS keystore を以下のコマンドで作成する

```
"C:\Program Files\VMware\Infrastructure\jre\bin\keytool.exe" -v -importkeystore -srckeystore C:\Certs\SSO\rui.pfx -srcstoretype pkcs12 -srcstorepass testpassword -srcalias rui -destkeystore C:\Certs\SSO\root-trust.jks -deststoretype JKS -deststorepass testpassword -destkeypass testpassword
```

2. Root CA 証明書をストアに格納する。もし intermediate CAs (中間証明書)がある場合は、Root CA 証明書である Root64-1.cer ファイル（Root64.cer ではない）を使います。  

```
"C:\Program Files\VMware\Infrastructure\jre\bin\keytool.exe" -v -importcert -keystore C:\Certs\SSO\root-trust.jks -deststoretype JKS -storepass testpassword -keypass testpassword -file C:\Certs\Root64-1.cer -alias root-ca
```

「この証明書を信頼しますか？」に「***yes***」と入力して、「Enter」を押す。

3. <span style="color: #f00;">認証済みの中間証明書があるなら、 Root64-2.cer file のハッシュ値が必要。もし、追加の中間証明書があるなら、それも追加してください</span>  

```
Set OpenSSL_BIN=C:\OpenSSL-Win32\bin\openssl.exe
%OpenSSL_BIN% x509 -subject_hash -noout -in C:\certs\Root64-2.cer
```

※出力例：8文字

> f8****51

4.中間認証局の証明書を JKS keystore 入れるのは、以下のコマンドで実施します。ただし、 ***YourHash*** は、前のステップで出力された値に置き換えてください

<span style="color: #f00;">***C:\Certs\Root64-2.cer -alias intermedediate-YourHash.0***</span>  

<b>C:\Certs\Root64-2.cer -alias f8****51.0</b>


```
"C:\Program Files\VMware\Infrastructure\jre\bin\keytool.exe" -v -importcert -noprompt -trustcacerts -keystore c:\Certs\SSO\root-trust.jks -deststoretype JKS -storepass testpassword -keypass testpassword -file c:\Certs\Root64-2.cer -alias f8****51.0
```

5. キーストアが全ての必要な証明書を持っているかを以下のコマンドで検証できます  
```
"C:\Program Files\VMware\Infrastructure\jre\bin\keytool.exe" -list -v -keystore c:\Certs\SSO\root-trust.jks
```

以下のように ***testpassword*** と入力して Enter を押す。

> キーストアのパスワードを入力してください: ***testpassword***  
> 　  
> キーストアのタイプ: JKS  
> キーストアのプロバイダ: SUN  
> 　  
> キーストアには 3 エントリが含まれます。
> 　  
> 別名: root-ca  
> 作成日: 2023/07/23  
> エントリのタイプ: trustedCertEntry  
> .....  
> \****************************************  
> \****************************************  


6. The SSO service は、JKSのコピーも必要なので、作成しておきます  

```
copy C:\Certs\SSO\root-trust.jks C:\Certs\SSO\server-identity.jks
```

　<br/>
[(Next) → 3. SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_self"}
