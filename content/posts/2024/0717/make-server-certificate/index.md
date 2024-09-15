---
title: WEBサーバーで利用するサーバー証明書の作成
description: IIS等のWEB サーバで利用可能な、サーバー証明書を作成する
date: 2024-07-17T15:20:00+09:00
tags: ["Windows Server", "IIS", "certificate", "server certificate", "CA"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応 (番外編)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * <span style="color: green; font-size: 1.2rem; font-weight: bold;">サーバー証明書の作成</span>
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. [Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_blank"}
1. [vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_blank"}
1. [vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_blank"}
1. [vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_blank"}
1. Update Manager (未確認…本環境ではインストールしていません)
:::

::: danger ■サーバ証明書が必要な理由
ブラウザの Edge, Chrome を利用した、SSL/TLS (https) 通信を利用した場合に、開発用WEBサーバにアクセスすると、
**ERR_SSL_KEY_USAGE_INCOMPATIBLE** 等のエラーが発生するため
:::

### ■確認事項
::: info ※作成時の補足事項
+ CA作成は、Windows Server 2008 R2 で実施しましたが、ここでは、Windows Server 2016/2019 Standard のIISで利用するサーバ証明書を作成します
+ 一部「***証明書ストアの選択***」が異なります ***(ローカルコンピューター → レジストリ)***
+ OpenSSL のバージョンは 0.98, 1.x, 3.3.x でも作成できます
:::

## OpenSSL でサーバー証明書の作成

### ■参照リンクから基本部分は引用

***[OpenSSL で構築した認証局 (CA) でサーバ証明書を発行する方法](https://nodejs.keicode.com/nodejs/openssl-how-to-issue-certs.php)***
<p>&nbsp;</p>

-----

**OpenSSL で構築した認証局 (CA) でサーバ証明書を発行する（Windows, IIS利用）**

※認証局(CA)や証明書の説明はここでは割愛します  
※あくまで、サーバー証明書を作成する手順です


→ [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/)

***※OS: Windows Server 2016 Standard, Windows Server 2019 Standard***  

OpenSSL で構築した認証局 (CA) でサーバ証明書を発行する方法


ここでは「OpenSSL で認証局 (CA) を構築する手順」で紹介した手順に従って構築した認証局(CA)を使って、SSL/TLS 通信で利用するサーバ証明書を発行する方法を説明します。  


## 1. サーバ証明書発行までの流れとポイント
### 1-1. サーバー証明書発行の流れ

<span style="color: #00f;">★参照元より引用</span>

> HTTPS 通信を行うためには「サーバ証明書」が必要です。  
> サーバ証明書を作成するにはまずは、ウェブサーバーの管理者が <mark>CSR</mark> (証明書署名要求 Certificate Signing Request) を作成するところから始めます。<br />
> <br />
> CSR を作成するには、ウェブサーバーの秘密鍵が必要です。このため CSR の作成は、秘密鍵の作成、CSR の作成という2ステップになります。  
> <br />
> また、CSR の作成の際には、具体的にどの国にある、何という会社・組織の、どんなホスト名のウェブサーバーであるかを入力する必要があります。  
> <br />
> CSR はひとつのテキストファイルとして作成されます。  
> <br />
> CSR を作成したら通常はそれを認証局 (CA) に送りデジタル署名してもらいます。この結果がサーバ証明書になります。<br />
> <br />
> 今回は CA も手元にあることを想定しています。つまり、自分でデジタル署名できる環境があることを想定しています。<br />
> CA の構築手順については「[OpenSSL で認証局 (CA) を構築する手順](https://nodejs.keicode.com/nodejs/openssl-create-ca.php)」をみてください。

### 1-2. SAN (サブジェクトの別名) の設定が必要

<span style="color: #00f;">★参照元より引用</span>

> CSR の作成時にひとつ注意点があります。<br />
> <br />
> 以前はウェブサーバーのホスト名は、CSR 作成時のコモンネーム (CN) の値として設定するので十分でした。 しかし、現在は複数のウェブサイトがひとつの証明書で利用できるのに伴い、
> X.509 証明書の拡張領域である subjectAltName (SAN と略されます) というところに設定する必要があります。<br />
> <br />
> Chrome ブラウザはバージョン 58 以降では commonName ではなく、subjectAltName のみをチェックするようになりました。 <br />
> <br />
> このため subjectAltName が設定されていない場合に "NET::ERR_CERT_COMMON_NAME_INVALID" などのエラーが表示されます。  
> <br />
> SAN 情報を設定するために、 CSR 作成時にも追加の設定ファイルが必要になりますし、CA 側の設定でも X.509 の拡張領域の取り扱いのオプションを設定する必要があります。<br />
> <br />
> 中間CAでデジタル署名する際の copy_extensions = copy オプションによって、 CSR の拡張領域の情報がコピーされます。


## 2. サーバ証明書を作成

前提として認証局(CA)は「OpenSSL で認証局 (CA) を構築する手順」に沿って作成しているものとします。 もし異なる場合はパスや設定ファイル (openssl.cfg) などが異なるために、ここで紹介する手順通りには動作しない場合がありますのでご注意ください。

### 2-1. OpenSSL を用いた CSR の作成方法
さて、まずはウェブサーバー管理者として CSR (Certificate Signing Request) を作成しましょう。

次の内容を VCS51.testdev.local.cfg として作成して、C:\CA に配置してください。

```
[ req ]
default_bits       = 2048
distinguished_name = req_distinguished_name
req_extensions     = req_ext

[ req_distinguished_name ]
countryName                 = Country Name (2 letter code)
countryName_default         = US
stateOrProvinceName         = State or Province Name (full name)
stateOrProvinceName_default = California
localityName                = Locality Name (eg, city)
localityName_default        = Palo Alto
organizationName            = Organization Name (eg, company)
organizationName_default    = VMware
commonName                  = Common Name (e.g. server FQDN or YOUR name)
commonName_default          = VCS51.testdev.local

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1   = VCS51
IP.1    = 192.168.1.100
DNS.2   = VCS51.testdev.local
DNS.3   = localhost
```

::: details 参照元(foo.example.com.cfg)
[ req ]  
default_bits       = 2048  
distinguished_name = req_distinguished_name  
req_extensions     = req_ext  

[ req_distinguished_name ]  
countryName                 = Country Name (2 letter code)  
countryName_default         = US  
stateOrProvinceName         = State or Province Name (full name)  
stateOrProvinceName_default = California  
localityName                = Locality Name (eg, city)  
localityName_default        = Torrance  
organizationName            = Organization Name (eg, company)  
organizationName_default    = Foo Company  
commonName                  = Common Name (e.g. server FQDN or YOUR name)  
commonName_default          = foo.example.com  

[ req_ext ]  
subjectAltName = @alt_names  

[ alt_names ]  
DNS.1   = foo.example.com  
DNS.2   = bar.test.com  
DNS.3   = localhost  
:::

ここで alt_names セクションの DNS 名 (DNS name) は、 あなたの環境に合わせて適当に書き換えてください。  
※IP アドレスは、DNSサーバがこのWEBサーバ環境に無い場合に必要な場合があります

*_default のエントリーは、コマンドラインでのデフォルト値 (何も入力せずに Enter を押下したときに使われる値) になります。あらかじめ、よく使う値に書き換えておくと便利です。

この設定ファイルでは、VCS51, VCS51.testdev.local というウェブサーバーにアクセスする想定としています。  
※vCenter Server 5.1 証明書更新のために、ローカルドメインとしています  

DNS 名といっても DNS サーバーのアドレスなどを設定するのではなく、「DNS で解決される名前」のことです。
RFC3280 の 4.2.1.7 "Subject Alternative Name" などで DNS name という書き方をしているのでその通りにかきました。
ウェブサーバーで使う証明書の場合通常は、ウェブサーバーのホスト名になります。  

次のコマンドでウェブサーバーの秘密鍵と CSR を作成します。


```
set path_openssl="C:\OpenSSL-Win32\bin\"
%path_openssl%openssl version
```

```
%path_openssl%openssl genrsa -aes256 -out intermediate\private\VCS51.testdev.local.key.pem 2048
%path_openssl%openssl req -config VCS51.testdev.local.cfg -key intermediate\private\VCS51.testdev.local.key.pem -new -sha256 -out intermediate\csr\VCS51.testdev.local.csr.pem
```

C:\CA\intermediate\csr\VCS51.testdev.local.csr.pem が CSR です。

次のコマンドで CSR の内容を確認できます。

```
%path_openssl%openssl req -noout -text -in intermediate\csr\VCS51.testdev.local.csr.pem
```

出力内容の中で特に、 SAN (Subject Alternative Name) が正しく設定されているか確認してください。

> ...  
>  X509v3 Subject Alternative Name:  
>  　　DNS:VCS51, IP Address:192.168.1.100, DNS:VCS51.testdev.local, DNS:localhost  
> ...  


## 2-2. OpenSSL を用いたサーバ証明書の発行

さて、上で作成した CSR を基に、次は認証局(CA)の作業として、サーバ証明書を作成します。


<span style="color: #f00;">ここでは、vCenter 5.1 の***証明書の使用方法***において、 ***Data encipherment*** の設定が必要になる。</span>

※参照元の設定では、以下のようになる  
　→「キー使用法」に警告表示が発生している

![Data_encipherment_ff](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/Data_encipherment_off.PNG)

※今回、以下のように設定しておく必要がある  
　→ ***vCenter 5.1 の証明書更新条件として必須*** のため

![Data_encipherment_on](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/Data_encipherment_on.PNG)

※ ***Data encipherment*** は、暗号化キーではなくパブリックキーを使用してユーザーデータを暗号化する場合に有効にします。

そのため、次の内容を ext.cfg として作成し、C:\CA に置いてください。

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


このファイルも使用して、サーバー証明書に署名（サイン）します。

```
%path_openssl%openssl ca -verbose -config intermediate\openssl.cfg -extfile C:\CA\ext.cfg -days 5000 -notext -md sha256 -in intermediate\csr\VCS51.testdev.local.csr.pem -out intermediate\certs\csr\VCS51.testdev.local.cert.pem
```

（中間認証局）キーのパスワード (***testpassword***) を入力し、「証明書にサインしますか？」に「***y***」、「コミットしますか？」に「***y***」を入力する。  

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

※証明書の確認
```
%path_openssl%openssl x509 -noout -text -in intermediate\certs\csr\VCS51.testdev.local.cert.pem
```

この結果作成されたファイル C:\intermediate\certs\VCS51.testdev.local.cert.pem がサーバ証明書になります。

キーファイル C:\intermediate\private\VCS51.testdev.local.key.pem と  
証明書ファイル C:\intermediate\certs\VCS51.testdev.local.cert.pem を使うことで、 HTTPS通信を行うことができます。

以上で、サーバ証明書が発行できました。


## 2-3. IIS用証明書を作る

IISマネージャー（証明書ストア）に登録できるのは、pfx 拡張子のみなので、以下「フレンドリ名」も付与して、登録用証明書を作る  
※「フレンドリ名」は、***OpenSSL098*** とした

```
%path_openssl%openssl pkcs12 -export -inkey intermediate\private\csr\VCS51.testdev.local.key.pem -in intermediate\certs\csr\VCS51.testdev.local.cert.pem -out intermediate\certs\csr\VCS51.testdev.local.crt.pfx -certfile intermediate\certs\intermediate.cert.pem -passout pass:testpassword -name "OpenSSL098"
```


## 2-4. IIS （WEB サーバー）に作成した証明書を設定する

**※OS：Server 2019 Standard (Server 2016 Standerd) の手順**

1. 「スタートメニュー」「Windows 管理ツール」→「インターネットインフォメーションサービス（IIS）マネジャー」をダブルクリックする。  
![IIS Start page](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis1.PNG)

1. IIS の「スタートページ」の下の「**＞**」をクリックして展開し、「サーバ証明書」をダブルクリックする。
![Server Certs](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis2.PNG)

1. 右の「操作」から「インポート」をクリックする。
![3s](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis3s.PNG)

1. 「証明書のインポート」「証明書ファイル（.pfx）」の「...」をクリック
![証明書のインポート](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis4.PNG)

1. C:\CA\intermediate\certs\ に移動して **VCS51.testdev.local.crt.pfx** を選択し、「開く」をクリックする。
![Cert Select](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis5.PNG)

1. 「パスワード」欄に、 ***testpassword*** と入力し、「証明書ストアの選択」は「個人」（default）とし、「この証明書のエクスポートを許可する」にチェック（default）
として、「OK」をクリックする。
![証明書のインポート 証明書選択](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis6.PNG)

1. 「名前」が上記で設定した「フレンドリ名」として、一覧に表示されていることを確認する。（右の表示で、証明書を確認することもできる）  
![証明書の一覧（設定分）](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis7.PNG)

1. 左の「接続」の「**＞**」（サイト）をクリックして展開し、証明書を設定するサイトをクリックする。ここでは、「***Default Web Site***」をクリックする。  
![バインドクリック](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis8s.PNG)

1. 右の「操作」から、「バインド」をクリックする。
![サイトバインド](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis9.PNG)

1. 【種類】に 「http」、【ポート】80、【IP】＊ と表示されている。すでに「https」「443」... がある場合は、クリックして「編集」を押す。  
　※無い場合は、「追加」をクリックして、「https」を選択し、ポート欄に「443」「＊」と入力する。  
　※「ホスト名」は、それ以外は、空欄チェックを付けず（default）のままとする。  

1. 最末の「SSL証明書」から「選択」をクリックし、一覧から先ほど設定した「フレンドリ名」 ***OpenSSL098*** を選択し、「OK」を押す。  
![バインドの編集](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis10.PNG)

1. 「OK」を押して画面を閉じる。
![IIS Restart](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_iis11s.PNG)


1. 右の「操作」の「Webサイトの管理」から「再起動」をクリックする。  


## 2-5. Edge, Chrome 等のブラウザで表示確認する

1. Edge, Chrome 等のブラウザで「***https\://vcs51/***」にアクセスして、サイトが表示されるか確認する。
![crome_warning1](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_chrome_1.PNG)

1. 「詳細設定」をクリック
![crome_warning2](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_chrome_2.PNG)

1. 「VCS51 にアクセスする（安全ではありません）」をクリックする。

![crome_iis_start_page](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_chrome_3.PNG)

　※自己認証局（CA）発行のサーバ証明書なので上記の警告は出るが、Edge, Chrome でも問題なくサイトが表示されるのを確認する。  

　※Firefox は「IISマネージャー」「サーバ証明書」、右「操作」の「自己署名入り証明書」で作成したものでも、エラーなく表示される。（※2024/07/17現在)  

　※（余談）Firefoxであれば、設定されている証明書が確認しやすい。  


以上で設定は完了です。



