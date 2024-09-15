---
title: vCenter 5.1 証明書期限切れ対応(CA)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(CA)
date: 2024-07-11T15:13:00+09:00
tags: ["vcenter5.1", "certificate expried", "CA", "Certificate Authorities"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(CA)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">OpenSSLで自己認証局(CA : Certificate Authorities)の作成</span>
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
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

## OpenSSLで自己認証局(CA : Certificate Authorities)を構築する (Windows) 

### ■参照リンクから基本部分は引用

***[OpenSSL で認証局 (CA) を構築する手順 (Windows)](https://nodejs.keicode.com/nodejs/openssl-create-ca.php)***
<p>&nbsp;</p>

-----

**OpenSSL を利用して公開鍵証明書認証局 (CA, Certificate Authority) を構築する**

※認証局(CA)や証明書の説明はここでは割愛します  
※あくまで、ルート証明書 (root CA)と中間証明書 (intermediate CA) を作成する手順です

***※OS: Windows Server 2008 R2 Datacenter (Standard, Enterprise)***

また、vCenter 5.1 Server の更新に利用する作成方法に変更しています。  
（この方法で作成しても、サーバ証明書まで作成できます）


::: warning OS: Windows Server 2008 R2 の DOS プロンプトの設定を変更する
※コマンドログを取得するために必須の設定  
「コマンドプロンプト」、「プロパティ」「レイアウト」で、**300** → **9999** とする。  
※ちなみに以降にコマンドプロンプトを開いても設定は継続する
:::


## 1. OpenSSL (Ver. 0.98) のダウンロードと配置

OpenSSLの過去ツールセットをバイナリで配布しているサイトがありますので、そちらからダウンロードしてインストールしてください。
（※当サイトのリンクからも可能です）

[OpenSSL Ver 0.98(k) win32 → Google Code Archice](https://code.google.com/archive/p/openssl-for-windows/downloads)  
※[OpenSSL Ver 0.98(k) win32 (Local-link)](https://kiyo-kad.github.io/kiyo-kad/dl/openssl-0.9.8k_WIN32.zip)

**●利用は、32bit版でOKです。構築手順も全て32bit 版を利用しています**

32bit Windows 版 を解凍し、フォルダ名を修正しています (openssl-0.9.8k_WIN32 →) C:\OpenSSL-Win32
コマンドプロンプトで、バージョンを確認すると次のようになりました。

```
set path_openssl="C:\OpenSSL-Win32\bin\"
%path_openssl%openssl version
```
> OpenSSL 0.9.8k 25 Mar 2009


## 2. CA 用のディレクトリの作成

ここでは C:\CA というフォルダ以下に環境を構築するものとします。 もし同じ名前のフォルダが既にあって使われていたら、適当にパスを読み替えてください。

C:\CA 内に、次の内容を setup.bat という名前で作成してください。

```
@mkdir root\certs
@mkdir root\crl
@mkdir root\newcerts
@mkdir root\private
@mkdir root\csr
@type nul > root\index.txt
@type nul > root\crlnumber
@echo 1000 > root\serial
@mkdir intermediate\certs
@mkdir intermediate\crl
@mkdir intermediate\newcerts
@mkdir intermediate\private
@mkdir intermediate\csr
@type nul > intermediate\index.txt
@type nul > intermediate\crlnumber
@echo 1000 > intermediate\serial
```

コマンドプロンプトを開き C:\CA に移動して、setup.bat を実行してください。

```
cd /d C:\CA
setup
```

## 3. ルート 認証局 (CA) の作成  
### 3-1. OpenSSL 設定ファイルの準備
C:\CA\root 内に以下の内容を openssl.cfg という名前で作成してください。

```
[ ca ]
default_ca    = CA_default

[ CA_default ]
dir              = C:\\CA\\root
certs            = C:\\CA\\root\\certs
crl_dir          = C:\\CA\\root\\crl
database         = C:\\CA\\root\\index.txt
new_certs_dir    = C:\\CA\\root\\newcerts
serial           = C:\\CA\\root\\serial
crlnumber        = C:\\CA\\root\\crlnumber
crl              = C:\\CA\\root\\crl.pem
certificate      = C:\\CA\\root\\certs\\ca.cert.pem
private_key      = C:\\CA\\root\\private\\ca.key.pem
name_opt         = ca_default
cert_opt         = ca_default
crl_extensions   = crl_ext
default_days     = 365
default_crl_days = 30
default_md       = sha256
preserve         = no
policy           = policy_match

[ policy_match ]
countryName             = match
stateOrProvinceName     = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ policy_anything ]
countryName             = optional
stateOrProvinceName     = optional
localityName            = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
default_bits            = 2048
distinguished_name      = req_distinguished_name
x509_extensions         = v3_ca
string_mask             = utf8only
default_md              = sha256

[ req_distinguished_name ]
countryName                     = Country Name (2 letter code)
countryName_default             = US
countryName_min                 = 2
countryName_max                 = 2
stateOrProvinceName             = State or Province Name (full name)
stateOrProvinceName_default     = California
localityName                    = Locality Name (eg, city)
localityName_default            = Palo Alto
0.organizationName              = Organization Name (eg, company)
0.organizationName_default      = VMware
organizationalUnitName          = Organizational Unit Name (eg, section)
organizationalUnitName_default  = http://www.vmware.com/
commonName                      = Common Name (e.g. server FQDN or YOUR name)
commonName_default              = VMware Root CA
commonName_max                  = 64
emailAddress                    = Email Address
emailAddress_default            = support@vmware.com
emailAddress_max                = 64

[ server_cert ]
basicConstraints       = CA:FALSE
nsCertType             = server
nsComment              = "OpenSSL Generated Server Certificate"
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage               = digitalSignature, keyEncipherment, DataEncipherment
extendedKeyUsage       = serverAuth

[ v3_ca ]
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints       = CA:true
keyUsage               = digitalSignature, cRLSign, keyCertSign

[ v3_intermediate_ca ]
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints       = CA:true, pathlen:0
keyUsage               = digitalSignature, cRLSign, keyCertSign

[ crl_ext ]
authorityKeyIdentifier = keyid:always
```

::: details 参照元(openssl.cfg)
[ ca ]  
default_ca    = CA_default  

[ CA_default ]  
dir              = C:\\CA\\root  
certs            = C:\\CA\\root\\certs  
crl_dir          = C:\\CA\\root\\crl  
database         = C:\\CA\\root\\index.txt  
new_certs_dir    = C:\\CA\\root\\newcerts  
serial           = C:\\CA\\root\\serial  
crlnumber        = C:\\CA\\root\\crlnumber  
crl              = C:\\CA\\root\\crl.pem  
certificate      = C:\\CA\\root\\certs\\ca.cert.pem  
private_key      = C:\\CA\\root\\private\\ca.key.pem  
name_opt         = ca_default  
cert_opt         = ca_default  
crl_extensions   = crl_ext  
default_days     = 365  
default_crl_days = 30  
default_md       = sha256  
preserve         = no  
policy           = policy_match  

[ policy_match ]  
countryName             = match  
stateOrProvinceName     = optional  
organizationName        = optional  
organizationalUnitName  = optional  
commonName              = supplied  
emailAddress            = optional  

[ policy_anything ]  
countryName             = optional  
stateOrProvinceName     = optional  
localityName            = optional  
organizationName        = optional  
organizationalUnitName  = optional  
commonName              = supplied  
emailAddress            = optional  

[ req ]  
default_bits            = 2048  
distinguished_name      = req_distinguished_name  
x509_extensions         = v3_ca  
string_mask             = utf8only  
default_md              = sha256  

[ req_distinguished_name ]  
countryName                     = Country Name (2 letter code)  
countryName_default             = US  
countryName_min                 = 2  
countryName_max                 = 2  
stateOrProvinceName             = State or Province Name (full name)  
stateOrProvinceName_default     = California  
localityName                    = Locality Name (eg, city)  
localityName_default            = Los Angeles  
0.organizationName              = Organization Name (eg, company)  
0.organizationName_default      = Ace Internet Inc.  
organizationalUnitName          = Organizational Unit Name (eg, section)  
organizationalUnitName_default  = http://ace.example.com/  
commonName                      = Common Name (e.g. server FQDN or YOUR name)  
commonName_default              = Ace Internet Root CA  
commonName_max                  = 64  
emailAddress                    = Email Address  
emailAddress_default            = ace@example.com  
emailAddress_max                = 64  

[ server_cert ]  
basicConstraints       = CA:FALSE  
nsCertType             = server  
nsComment              = "OpenSSL Generated Server Certificate"  
subjectKeyIdentifier   = hash  
authorityKeyIdentifier = keyid,issuer:always  
keyUsage               = critical, digitalSignature, keyEncipherment  
extendedKeyUsage       = serverAuth  

[ v3_ca ]  
subjectKeyIdentifier   = hash  
authorityKeyIdentifier = keyid:always,issuer  
basicConstraints       = critical,CA:true  
keyUsage               = critical, digitalSignature, cRLSign, keyCertSign  

[ v3_intermediate_ca ]  
subjectKeyIdentifier   = hash  
authorityKeyIdentifier = keyid:always,issuer  
basicConstraints       = critical,CA:true, pathlen:0  
keyUsage               = critical, digitalSignature, cRLSign, keyCertSign  

[ crl_ext ]  
authorityKeyIdentifier = keyid:always  
:::


### 3-2. 秘密鍵とルートCA証明書の作成
コマンドプロンプトから、次のコマンドを実行します。

秘密鍵を生成するときなどはパスフレーズの入力を求められる時がありますが、この資料では全て **testpassword** と入力することにします。  
実際に利用する場合はあなたのセキュリティの要件に合わせて、適宜強固なパスフレーズを使ってください。  
ただし、秘密鍵にアクセスするたびに必要となるので、忘れないように注意してください。

```
%path_openssl%openssl genrsa -aes256 -out root\private\ca.key.pem 2048
%path_openssl%openssl req -config root\openssl.cfg -key root\private\ca.key.pem -new -x509 -days 9999 -sha256 -extensions v3_ca -out root\certs\ca.cert.pem
```

※パスワードフレーズを聞かれたら、***testpassword*** と入力する

> .....  
> Enter pass phrase for root\private\ca.key.pem: ***testpassword***  
> Verifying - Enter pass phrase for root\private\ca.key.pem: ***testpassword***  
> .....  
> Enter pass phrase for root\private\ca.key.pem: ***testpassword***  
> .....  

ここで作成した ca.key.pem や ca.key.pem がそれぞれ、 ルートCAの秘密鍵とルートCA証明書です。

※認証局の名前などは上で作成した設定ファイルでデフォルト値を利用する場合は、質問には Enter を押してください  
※ルートCA(自己)証明書のため、**サイン済み**として、**直接証明書を作成しています**  
※証明書署名要求(CSR) を作成して自己署名（サイン）する方法もあります

ルートCA証明書の内容は次のコマンドで表示できます。

```
%path_openssl%openssl x509 -noout -text -in root\certs\ca.cert.pem
```

### 3-3. Windows にルートCA証明書を登録
ルートCA証明書は Windows の証明書ストアに格納することで、ブラウザから認識できるようになります。

上記の手順では PEM 形式の証明書が作成されますが、Windows に登録するためには PKCS #7 (p7b) 形式に変換する必要があります。

次のコマンドで PKCS #7 形式の証明書を作成します。

```
%path_openssl%openssl crl2pkcs7 -nocrl -certfile root\certs\ca.cert.pem -out root\certs\ca.cert.p7b
```

Windows に今作成した CA証明書を登録しましょう。

「スタートボタン」から、「ファイル名を指定して実行」に ***mmc*** と入力

![ファイル名を指定して実行-mmc](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_1.PNG)

「コンソール ルート」から、「ファイル」→「スナップインの追加と削除」をクリックする。
![コンソール ルート](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_2s.PNG)

「スナップインの追加と削除」（利用できるスナップイン）の一番下の「証明書」をクリックし、「追加」を押す。

![スナップインの追加と削除](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_3.PNG)

「証明書スナップイン」で、***「コンピューター アカウント」にチェック*** して、「次へ」「ローカルコンピューター」(defaultのまま)「完了」を押下する。

![コンピューターアカウントにチェック](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_4.PNG)

![コンピューター」(defaultのまま)](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_5.PNG)

![コンソールルート（証明書）追加ＯＫ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_6.PNG)

「ＯＫ」をクリックする。

![コンソールルート（証明書）](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_7.PNG)

「＋」をクリックし、さらに「信頼されたルート証明機関」「証明書」をクリックする。
そうすると、証明書一覧が表示される。

![証明書（展開）信頼されたルート証明機関](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_8.PNG)


「信頼されたルート証明機関」(Trusted Root Certification Authorities) の下の「証明書」を右クリックし、表示されたコンテキストメニューから「全てのタスク」から「インポート」を選択します。

![信頼されたルート証明機関・インポート](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_9.PNG)

![証明書インポート開始](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_10.PNG)

「次へ」をクリック

![インポートする証明ファイル](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_11.PNG)

「参照」をクリック

![証明書のフォルダ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_12.PNG)

証明書が作成された場所「C:\CA\root\certs」フォルダに移行し、ファイル拡張子で「PKCS #7 証明書」を選択する。

![作成された証明書](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_13.PNG)

C:\CA\root\certs\ca.cert.p7b として証明書が作成されていますので、それを選択し、「開く」をクリックする。

![証明書選択完了](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_14.PNG)

「次へ」をクリックする。

![証明書をすべて次のストアに配置する](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_15.PNG)

「証明書をすべて次のストアに配置する」を選択し、「参照」をクリックする。

![物理ストア・ローカルコンピュータ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_16.PNG)

<span style="color: #f00;">「***物理ストアを表示する***」に***チェックを入れて***、「***信頼されたルート証明機関***」「***ローカルコンピュータ***」を選ぶ</span>


::: info Server 2016/2019 Standard の場合
「信頼されたルート証明機関」「***レジストリ***」を選ぶ
:::


![信頼されたルート証明機関 ローカルコンピュータ 選択](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_17.PNG)

「OK」をクリックする。

![信頼されたルート証明機関 ローカルコンピュータ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_18.PNG)

「次へ」をクリックする。


![証明書インポートの完了](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_19.PNG)

「完了」をクリックする。

![正しくインポートされました](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_20.PNG)

「更新」アイコンをクリックして、インポートされた証明書を確認する。

![証明書登録確認](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_21e.PNG)

画面の指示に従い登録を済ませ、表示を更新すると「信頼されたルート証明機関」の下の「証明書」の中に、上で作成したルートCA証明書が表示されるはずです。  

本事例では、「***VMware Root CA***」が登録されている。


これでルートCAの準備ができました。

次に中間CAを作成します。




## 4. 中間 認証局 (CA) の作成
通常、認証局には大きく分けて二種類あり、ひとつはルートCAともうひとつは中間CAです。ルートCAは中間CAの認証を行う(証明書の発行を行う)ために使われ、***HTTPS 通信で使うサーバ証明書などの署名は中間CAで行います。***

### 4-1. OpenSSL 設定ファイルの準備
C:\CA\intermediate 内に以下の内容を openssl.cfg という名前で作成してください。

```
[ ca ]
default_ca    = CA_default

[ CA_default ]
dir              = C:\\CA\\intermediate
certs            = C:\\CA\\intermediate\\certs
crl_dir          = C:\\CA\\intermediate\\crl
database         = C:\\CA\\intermediate\\index.txt
new_certs_dir    = C:\\CA\\intermediate\\newcerts
serial           = C:\\CA\\intermediate\\serial
crlnumber        = C:\\CA\\intermediate\\crlnumber
crl              = C:\\CA\\intermediate\\crl.pem
certificate      = C:\\CA\\intermediate\\certs\\intermediate.cert.pem
private_key      = C:\\CA\\intermediate\\private\\intermediate.key.pem
x509_extensions  = usr_cert
name_opt         = ca_default
cert_opt         = ca_default
crl_extensions   = crl_ext
default_days     = 365
default_crl_days = 30
default_md       = sha256
preserve         = no
policy           = policy_anything
copy_extensions  = copy

[ policy_anything ]
countryName            = optional
stateOrProvinceName    = optional
localityName           = optional
organizationName       = optional
organizationalUnitName = optional
commonName             = supplied
emailAddress           = optional

[ req ]
default_bits           = 2048
distinguished_name     = req_distinguished_name
x509_extensions        = v3_ca
string_mask            = utf8only
default_md             = sha256

[ req_distinguished_name ]
countryName                    = Country Name (2 letter code)
countryName_default            = US
countryName_min                = 2
countryName_max                = 2
stateOrProvinceName            = State or Province Name (full name)
stateOrProvinceName_default    = California
localityName                   = Locality Name (eg, city)
localityName_default           = Palo Alto
0.organizationName             = Organization Name (eg, company)
0.organizationName_default     = VMware
organizationalUnitName         = Organizational Unit Name (eg, section)
organizationalUnitName_default = http://www.vmware.com/
commonName                     = Common Name (e.g. server FQDN or YOUR name)
commonName_default             = VMware Code Signing CA
commonName_max                 = 64
emailAddress                   = Email Address
emailAddress_default           = support@vmware.com
emailAddress_max               = 64

[ server_cert ]
basicConstraints       = CA:FALSE
nsCertType             = server
nsComment              = "OpenSSL Generated Server Certificate"
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage               = digitalSignature, keyEncipherment, DataEncipherment
extendedKeyUsage       = serverAuth

[ v3_ca ]
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints       = CA:true
keyUsage               = digitalSignature, cRLSign, keyCertSign

[ v3_intermediate_ca ]
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints       = CA:true, pathlen:0
keyUsage               = digitalSignature, cRLSign, keyCertSign

[ crl_ext ]
authorityKeyIdentifier = keyid:always
```

::: details 参照元(openssl.cfg)
[ ca ]  
default_ca    = CA_default

[ CA_default ]  
dir              = C:\\CA\\intermediate  
certs            = C:\\CA\\intermediate\\certs  
crl_dir          = C:\\CA\\intermediate\\crl  
database         = C:\\CA\\intermediate\\index.txt  
new_certs_dir    = C:\\CA\\intermediate\\newcerts  
serial           = C:\\CA\\intermediate\\serial  
crlnumber        = C:\\CA\\intermediate\\crlnumber  
crl              = C:\\CA\\intermediate\\crl.pem  
certificate      = C:\\CA\\intermediate\\certs\\intermediate.cert.pem  
private_key      = C:\\CA\\intermediate\\private\\intermediate.key.pem
x509_extensions  = usr_cert  
name_opt         = ca_default  
cert_opt         = ca_default  
crl_extensions   = crl_ext  
default_days     = 365  
default_crl_days = 30  
default_md       = sha256  
preserve         = no  
policy           = policy_anything  
copy_extensions  = copy  

[ policy_anything ]  
countryName            = optional  
stateOrProvinceName    = optional  
localityName           = optional  
organizationName       = optional  
organizationalUnitName = optional  
commonName             = supplied  
emailAddress           = optional  

[ req ]  
default_bits           = 2048  
distinguished_name     = req_distinguished_name  
x509_extensions        = v3_ca  
string_mask            = utf8only  
default_md             = sha256  

[ req_distinguished_name ]  
countryName                    = Country Name (2 letter code)  
countryName_default            = US  
countryName_min                = 2  
countryName_max                = 2  
stateOrProvinceName            = State or Province Name (full name)  
stateOrProvinceName_default    = California  
localityName                   = Locality Name (eg, city)  
localityName_default           = Los Angeles  
0.organizationName             = Organization Name (eg, company)  
0.organizationName_default     = Ace Internet Inc.  
organizationalUnitName         = Organizational Unit Name (eg, section)  
organizationalUnitName_default = http://ace.example.com/  
commonName                     = Common Name (e.g. server FQDN or YOUR name)  
commonName_default             = Ace Internet Code Signing CA  
commonName_max                 = 64  
emailAddress                   = Email Address  
emailAddress_default           = ace@example.com  
emailAddress_max               = 64  

[ server_cert ]  
basicConstraints       = CA:FALSE  
nsCertType             = server  
nsComment              = "OpenSSL Generated Server Certificate"  
subjectKeyIdentifier   = hash  
authorityKeyIdentifier = keyid,issuer:always  
keyUsage               = critical, digitalSignature, keyEncipherment  
extendedKeyUsage       = serverAuth  

[ v3_ca ]  
subjectKeyIdentifier   = hash  
authorityKeyIdentifier = keyid:always,issuer  
basicConstraints       = critical,CA:true  
keyUsage               = critical, digitalSignature, cRLSign, keyCertSign  

[ v3_intermediate_ca ]  
subjectKeyIdentifier   = hash  
authorityKeyIdentifier = keyid:always,issuer  
basicConstraints       = critical,CA:true, pathlen:0  
keyUsage               = critical, digitalSignature, cRLSign, keyCertSign  

[ crl_ext ]  
authorityKeyIdentifier = keyid:always  
:::

### 4-2. 中間CA証明書の発行
次のコマンドで中間CAの秘密鍵を生成し、CA証明書のCSRを作成して、ルートCAにて中間CAの証明書を発行します。


```
%path_openssl%openssl genrsa -aes256 -out intermediate\private\intermediate.key.pem 2048
%path_openssl%openssl req -config intermediate\openssl.cfg -new -sha256 -key intermediate\private\intermediate.key.pem -out intermediate\csr\intermediate.csr.pem
```

以下で、証明書に署名します。
```
%path_openssl%openssl ca -config root\openssl.cfg -extensions v3_intermediate_ca -days 5000 -notext -md sha256 -in intermediate\csr\intermediate.csr.pem -out intermediate\certs\intermediate.cert.pem
```

::: details Signature Information
Using configuration from root\openssl.cfg  
Loading 'screen' into random state - done  
Enter pass phrase for C:\CA\root\private\ca.key.pem:  
Check that the request matches the signature  
Signature ok  
Certificate Details:  
　　　　Serial Number: 4096 (0x1000)  
　　　　Validity  
　　　　　　Not Before: Jul  1 07:52:25 2024 GMT  
　　　　　　Not After : Mar 10 07:52:25 2038 GMT  
　　　　Subject:  
　　　　　　countryName               = US  
　　　　　　stateOrProvinceName       = California  
　　　　　　organizationName          = VMware  
　　　　　　organizationalUnitName    = http://www.vmware.com/  
　　　　　　commonName                = VMware Code Signing CA  
　　　　　　emailAddress              = support@vmware.com  
　　　　X509v3 extensions:  
　　　　　　X509v3 Subject Key Identifier:  
　　　　　　　　71:98:B6:21:3B:FC:31:17:B1:C6:E6:4D:8D:22:58:D9:91:5E:62:B6  
　　　　　　X509v3 Authority Key Identifier:  
　　　　　　　　keyid:ED:DF:8F:25:73:D4:B4:33:7E:5C:B0:43:22:0A:AF:3A:24:14:2F:7F  
　　　　　　X509v3 Basic Constraints:  
　　　　　　　　CA:TRUE, pathlen:0  
　　　　　　X509v3 Key Usage:  
　　　　　　　　Digital Signature, Certificate Sign, CRL Sign  
Certificate is to be certified until Mar 10 07:52:25 2038 GMT (5000 days)  
Sign the certificate? [y/n]:y  


1 out of 1 certificate requests certified, commit? [y/n]y  
Write out database with 1 new entries  
Data Base Updated  
:::

キーのパスワード (***testpassword***) を入力し、「証明書にサインしますか？」に「***y***」、「コミットしますか？」に「***y***」を入力する。  

<span style="color: #f00;">※エラーが出た場合、コマンド引数等が間違っていないか確認すること  
　（一度エラーになると、シリアル番号等を変更しないと、再度サインできない。同一証明書が複数できることの回避と思われる）</span>

※証明書の確認
```
%path_openssl%openssl x509 -noout -text -in intermediate\certs\intermediate.cert.pem
```

### 4-3. Windows に中間CA証明書を登録
ルートCA証明書と同様に、中間CA証明書も Windows に登録します。PEM のままでは登録できないので、 PKCS #7 (p7b) に変換します。

```
%path_openssl%openssl crl2pkcs7 -nocrl -certfile intermediate\certs\intermediate.cert.pem -out intermediate\certs\intermediate.cert.p7b
```

生成された intermediate.cert.p7b を Windows のコンピュータ証明書管理画面で登録します。

「中間証明機関」の下の「証明書」フォルダにインポートしてください。その他の手順は、上記の「ルートCA証明書の登録」と同様です。


![中間証明機関の一覧](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_22.PNG)

「中間証明機関」「証明書」クリックする。そうすると、同様に証明書一覧が表示される。

![中間証明書機関・インポート](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_23.PNG)

「中間証明書機関」(Intermediate Certification Authorities) の下の「証明書」を右クリックし、表示されたコンテキストメニューから「全てのタスク」から「インポート」を選択します。

![中間証明書のフォルダ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_24.PNG)

証明書が作成された場所「C:\CA\intermediate\certs」フォルダに移行し、ファイル拡張子で「PKCS #7 証明書」を選択する。  
C:\CA\intermediate\certs\ca.cert.p7b として証明書が作成されていますので、それを選択して、「開く」をクリックする。

![中間証明書選択完了](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_25.PNG)

「次へ」をクリックする。

![証明書をすべて次のストアに配置する](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_26.PNG)

「証明書をすべて次のストアに配置する」を選択し、「参照」をクリックする。

![中間物理ストア・ローカルコンピュータ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_27.PNG)

<span style="color: #f00;">「***物理ストアを表示する***」に***チェックを入れて***、「***中間証明機関***」「***ローカルコンピュータ***」を選ぶ</span>


::: info Server 2016/2019 Standard の場合
「中間証明機関」「***レジストリ***」を選ぶ
:::


![中間証明機関 ローカルコンピュータ](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_28.PNG)

「次へ」をクリックする。

![中間証明書インポートの完了](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_29.PNG)

「完了」をクリックする。

![正しくインポートされました](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_20.PNG)

「更新」アイコンをクリックして、インポートされた証明書を確認する。

![中間証明書登録確認](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_30e.PNG)

※「コンソール１」の右上「×」ボタンを押すと以下のダイアログがでますが、「いいえ」をクリックする

![コンソール１(閉じるダイアログ)](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_ca_mmc_31.PNG)


以上でルートCAと中間CAを構築することができました。

&nbsp;  

続いて、[vCenter 5.1 証明書更新 → 2. SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_self"}


あるいは、[サーバー証明書の作成](../make-server-certificate/){target="_self"}


