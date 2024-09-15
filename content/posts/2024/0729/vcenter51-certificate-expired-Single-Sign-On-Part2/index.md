---
title: vCenter 5.1 証明書期限切れ対応(Single Sign On)(Part2)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(Single Sign On)(Part2)
date: 2024-07-29T14:29:03+09:00
tags: ["vcenter5.1", "certificate expried", "SSO", "Single Sign On"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(SSO: Single Sign On)(Part2)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">SSO (vCenter Single Sign On)(Part2)</span>
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
+ SSO (vCenter Single Sign On)(Part1) は完了していますか？　(Part2) は継続手順です
:::


## Manual SSO Certificate Replacement
### 手動でのSSO 用証明書の置き換え

　vcenter51-certificate-expired-Single-Sign-On(Part1) で作成したファイルが以下のようになっていることを再度確認する

<!-- chain.pem   Required for VMware automated certificate manager -->
***ext.cnf*** - Configuration file with X509v3 extentions to add (KeyUsage dataEncipherment added) for intermediate CA Mint(sign) Certificates  
***root-trust.jks*** - Java keystore with root certificates  
***rui.crt*** - Minted PKCS#7 x.509 certificate from your trusted CA  
***rui.csr*** - Base-64 encoded certificate signing request (CSR)  
***rui.key*** - Private RSA 2048-bit key  
***rui.pfx*** - Password protected PKCS #12 certificate file, private key, and root CA certs  
***SSO.cfg*** - OpenSSL certificate request configuration file for the SSO service  
***server-identity.jks*** - Java keystore with root certificates  

![Certs_SSO_Files](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_certs_SSO1.PNG)


## Manual SSO Certificate Replacement Procedures
### 手動でのSSO 用証明書の置き換え手順

  <br />

1. vcenter SSO certificate files を置くフォルダを作る。場所やフォルダ名は適宜でいい（但し名前にスペースを入れない）が、 vCenter service accounts が完全なアクセス権限を持っているものとする。
ここでは、以下のようなフォルダとした

```
mkdir c:\ProgramData\VMware\SingleSignOn\SSL
```

すでに作ってあるファイルを C:\Certs\SSO からこのフォルダへコピーする。  
（rui.crt, rui.key, rui.pfx, root-trust.jks, and server-identity.jks）  
また、 C:\Certs からは、root64.cer ファイルを同じフォルダへコピーする。

```
copy C:\Certs\SSO\rui.crt C:\ProgramData\VMware\SingleSignOn\SSL
copy C:\Certs\SSO\rui.key C:\ProgramData\VMware\SingleSignOn\SSL
copy C:\Certs\SSO\rui.pfx C:\ProgramData\VMware\SingleSignOn\SSL
copy C:\Certs\SSO\*.jks C:\ProgramData\VMware\SingleSignOn\SSL
copy C:\Certs\Root64.cer C:\ProgramData\VMware\SingleSignOn\SSL
```

![SingleSignOn_SSL_Files](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_ssl1h.PNG)

2. vCenter SSO SSL certificates の再構築は、最初の確認として SSO と Security Token Services のグループチェックを行う。  

　※ ***Server.FQDN*** の設定は、DNSサーバ環境内にあれば、 ***vcs51.testdev.local*** 、無い場合は、**サーバの IP アドレス**とする（本手順はIPアドレス）。そうしないと、恐らくエラーになる

```
SET JAVA_HOME=C:\Program Files\VMware\Infrastructure\jre
cd /d C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli
ssolscli.cmd listServices https://192.168.1.100:7444/lookupservice/sdk
```

> ssolscli.cmd listServices https://Server.FQDN:7444/lookupservice/sdk

::: danger ■注意点
<span style="color: #f00;">***以下(Service 3) のように、多数ある出力の内で、３つの『サービス』に着目する（※それ以外は、処理不要）***</span>
:::


###### ■処理結果 （他にも出るが確認が必要なのは、以下の３つ）

> **Service 3 <span style="font-size: 1.6rem; color: #f00;">←</span>**  
> \-----------  
> ***serviceId={FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:3***  
> serviceName=The group check interface of the SSO server  
> type=urn:sso:groupcheck  
> endpoints={[url=https\://VCS51:7444/sso-adminserver/sdk,protocol=vmomi]}  
> version=1.0  
> description=The group check interface of the SSO server  
> ownerId=&lt;null&gt;  
> productId=&lt;null&gt;  
> viSite={FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}  

> **Service 5 <span style="font-size: 1.6rem; color: #f00;">←</span>**  
> \-----------  
> ***serviceId={FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:2***  
> serviceName=The security token service interface of the SSO server  
> type=urn:sso:sts  
> endpoints={[url=https\://VCS51:7444/ims/STSService?wsdl,protocol=wsTrust]}  
> version=1.0  
> description=The security token service interface of the SSO server  
> ownerId=&lt;null&gt;  
> productId=&lt;null&gt;  
> viSite={FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}  

> **Service 6 <span style="font-size: 1.6rem; color: #f00;">←</span>**  
> \-----------  
> ***serviceId={FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:1***  
> serviceName=The administrative interface of the SSO server  
> type=urn:sso:admin  
> endpoints={[url=https\://VCS51:7444/sso-adminserver/sdk,protocol=vmomi]}  
> version=1.0  
> description=The administrative interface of the SSO server  
> ownerId=&lt;null&gt;  
> productId=&lt;null&gt;  
> viSite={FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}  
> Return code is: Success  
> 0  

****************************************


##### STS.properties

C:\Certs 内に、次の内容を ***STS.properties*** というファイル名前で作成してください。（以下２つも同様に作成します）

```
[service]
friendlyName=STS for Single Sign On
version=1.0
ownerId=
type=urn:sso:sts
description=The Security Token Service of the Single Sign On server.

[endpoint0]
uri=https://VCS51.testdev.local:7444/ims/STSService
ssl=C:\ProgramData\VMware\SingleSignOn\SSL\Root64.cer
protocol=wsTrust
```

##### gc.properties

```
[service]
 friendlyName=The group check interface of the SSO server
 version=1.0
 ownerId=
 type=urn:sso:groupcheck
 description=The group check interface of the SSO server

[endpoint0]
 uri=https://VCS51.testdev.local:7444/sso-adminserver/sdk
 ssl=C:\ProgramData\VMware\SingleSignOn\SSL\Root64.cer
 protocol=vmomi
```

##### admin.properties

```
[service]
 friendlyName=The administrative interface of the SSO server
 version=1.0
 ownerId=
 type=urn:sso:admin
 description=The administrative interface of the SSO server

[endpoint0]
 uri=https://VCS51.testdev.local:7444/sso-adminserver/sdk
 ssl=C:\ProgramData\VMware\SingleSignOn\SSL\Root64.cer
 protocol=vmomi
```

3. 上記のサービスで取得した、 ServiceID のファイルを作成  

※Notepad.exe で、以下の３ファイル (sts_id, gc_id, admin_id) を同様に C:\Certs に作成する  
※IDの途中に Enter とかが入らないようにしてください
※「プロトコル」フィールドは極めて重要であり、３つのサービス全てで、同じではありません。
３つ全てに「wsTrust」を使用すると、セキュリティーホールが発生し、SSOサーバが停止します

##### sts_id

> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:2

![sts_id](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sts_id_1.PNG)

##### gc_id

> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:3

![gc_id](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_gc_id_1.PNG)

##### admin_id

> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:1

![admin_id](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_admin_id_1.PNG)

*******************************************************************************

　<br />

4. チェックポイントとして、C:\Certs フォルダ構成が以下の Snapshot のようになっていることを確認する  

![Certs_SSO_Files](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_Certs_SSO_3.PNG)

::: danger ※もしリカバリーするなら、SQL Server のバックアップも取得しておくこと
<span style="color: #f00;">***（…と書いたが、ＤＢからのリカバー作業は実質できない。<br />
→リカバリーは仮想ゲストのバックアップをデプロイする）***</span>
:::

<span>
　<br />
</span>

5. **vCenter Single Sign On** service をストップする  

![Windows Service SSO](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_service_SSO1.PNG)

<span>
　<br />
</span>

6. **C:\Program Files\VMware\Infrastructure\SSOServer\security** フォルダの **root-trust.jks** , **server-identity.jks** をバックアップして、 **C:\Certs\SSO** からこのファイルを置き換える  

　※ここでは、２ファイルのみの置き換えだが、もう１つファイル **root-ca.jks** があるが、これもバックアップ（退避）しておく

> cd /d C:\Program Files\VMware\Infrastructure\SSOServer\security

```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
mkdir %CopyFolderCuren%\[SSO-Part2][1]%folderName%_VMware_Infra_SSOServer_security\
move "C:\Program Files\VMware\Infrastructure\SSOServer\security"\*.* %CopyFolderCuren%\[SSO-Part2][1]%folderName%_VMware_Infra_SSOServer_security

copy c:\Certs\SSO\root-trust.jks "C:\Program Files\VMware\Infrastructure\SSOServer\security"
copy c:\Certs\SSO\server-identity.jks "C:\Program Files\VMware\Infrastructure\SSOServer\security"
```


<span>
　<br />
</span>

7. <span style="color: #f00;">以下のコマンドを実行し、 ***Enter master password*** に、マスターパスワードを入力し、 Enter を押す。  
（このパスワードは、SSOをインストールしたときに設定したもの）  
　※ ***admin@System-Domain*** と設定したもの  
　※ ***仮に SSO (Single Sign On) 利用時に期限等で変更していても、そのパスワードではない。あくまでSSOをインストールした時のもの***  </span>

```
SET JAVA_HOME=C:\Program Files\VMware\Infrastructure\jre
cd /d C:\Program Files\VMware\Infrastructure\SSOServer\utils
ssocli configure-riat -a configure-ssl --keystore-file C:\ProgramData\VMware\SingleSignOn\SSL\root-trust.jks --keystore-password testpassword
```


::: danger 注意！！
<span style="color: #f00;">**※SQL Server (DB)内のパスワード（ハッシュ値）を変更できますが、この手法では証明書の更新はできません。
インストール時に設定した admin@System-Domain のパスワードが必要です。**</span>
:::


> C:\Program Files\VMware\Infrastructure\SSOServer\utils>ssocli configure-riat -aconfigure-ssl --keystore-file C:\ProgramData\VMware\SingleSignOn\SSL\root-trust.jks --keystore-password testpassword  
> Enter master password: **********  
>  
> Executing action: 'configure-ssl'  
>  
> Updating SSL configuration  
>  
> Successfully executed action: 'configure-ssl'  


![SSO master passowrd ok](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_master_password_ok.PNG)

<span>
　<br />
</span>

8.  vCenter Single Sign On service をリスタートしてください。その後 2.3 分待つ  


9. ブラウザを立ち上げ (local Server) 、以下 URL を入力する  

```
https://192.168.1.100:7444/sso-adminserver/sdk
https://VCS51:7444/sso-adminserver/sdk
```

> https://SSOserver.FQDN:7444/sso-adminserver/sdk

![Browser 7444 sso-adminserver](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_7444_sso-adminserver1b.PNG)

「このサイトの閲覧を続行する（推奨されません）。」をクリックする

![Browser 7444 sso-adminserver OK](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_7444_sso-adminserver2ok.PNG)

**https\://VCS51:7444/sso-adminserver/sdk** でアクセス出来た場合

![Browser 7444 sso-adminserver_vcs51](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_7444_vcs51_1.PNG)


ブラウザの「鍵マーク / 証明書」クリックして、**サーバ証明書の期限が延長されている**ことを確認する。  
　  
![web site certification](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_site_certification.PNG)

※例では、「**2037**」年までになってる (5000日に期限を設定したため)

![SSO Certificate update](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_SSO_Certificate_update_1.PNG)

一旦は、**SSO (vCenter Single Sign On)(Part2)** はこれで完了です。  

<span>
　<br />
</span>

::: warning 注意！
※以降も Single-Sign-ON (SSO) 証明書の更新手順は続くのだが、以降の手順は、**SSO (vCenter Single Sign On)(Part3)** に記載する  
<span style="color: #f00;">以下の手順は、SSL証明書更新完了時、**Single-Sign-ON (SSO)** へログインする場合にエラーとなるので、以下の手順を追加する</span>
:::

## Single-Sign-ON (SSO) ログイン認証の証明書を置き換える


念のため、更新前のファイルをバックアップしておく

> cd /d C:\ProgramData\VMware\SSL

```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
mkdir %CopyFolderCuren%\[SSO-Part2][2]%folderName%_VMware_SSL\
move C:\ProgramData\VMware\SSL\*.* %CopyFolderCuren%\[SSO-Part2][2]%folderName%_VMware_SSL
```

以下でファイルをコピーする  

::: details ※コマンドに設定するハッシュ値に関して
　※上記処理にて、計算しているが、再度記載しておく
```
Set OpenSSL_BIN=C:\OpenSSL-Win32\bin\openssl.exe
%OpenSSL_BIN% x509 -subject_hash -noout -in C:\certs\Root64-2.cer
```
> f8****51  
:::

(ファイル名がハッシュ値となる **f8****51.0** と設定)

```
copy c:\Certs\Root64.cer C:\ProgramData\VMware\SSL\f8****51.0

more c:\Certs\Root64.cer >> C:\ProgramData\VMware\SSL\ca_certificates.crt
```
-----


　<br/>
[(Next) → 4. SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_self"}
