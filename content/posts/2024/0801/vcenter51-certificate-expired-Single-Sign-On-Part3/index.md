---
title: vCenter 5.1 証明書期限切れ対応(Single Sign On)(Part3)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(Single Sign On)(Part3)
date: 2024-08-01T16:13:30+09:00
tags: ["vcenter5.1", "certificate expried", "SSO", "Single Sign On"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(SSO: Single Sign On)(Part3)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">SSO (vCenter Single Sign On)(Part3)</span>
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
+ SSO (vCenter Single Sign On)(Part2) は完了していますか？　(Part3) は継続手順です
:::

## SSO (vCenter Single Sign On)(Part2) から続く\- SSL 証明書の3つのサービスにバインドする
### updateService は大文字と小文字が区別されることに注意


10. To bind the trusted SSL certificate to each of the three services issue the commands below in the same command prompt Window as above. Note that “updateService” is CASE SENSITIVE.

```
cd /d C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli
```

ssolscli.cmd updateService -d https\://SSOServer.Domain:7444/lookupservice/sdk -u admin@System-Domain -p **YourPassword** -si C:\Certs\sts_id -ip C:\Certs\sts.properties  

> ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p ********** -si C:\Certs\sts_id -ip C:\Certs\sts.properties  

<span style="color: #f00;">　**※上記のコマンドでOKのはずだが、恐らく以下のようなエラーになる。**  
　**→『マスターパスワード(admin@System-Domain)』の変更が必要です**</span>

> C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli>ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p ********** -si c:\Certs\sts_id -ip c:\Certs\sts.properties  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51:7444/ims/STSService?wsdl  
> **Cannot authenticate user**  
> Return code is: InvalidCredentials  
> **3**  

![SSO 7444 service1(STS) ng](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_service1_sts_ng.PNG)

## Master Password (admin@System-Domain)のパスワードの変更

　以下を実行する

```
cd /d C:\Program Files\VMware\Infrastructure\SSOServer\utils  
rsautil reset-admin-password  
```

そして、新旧のパスワードを入力する  
（新パスワードは適宜だがここでは、***VMware1234!*** とした）  

Enter master password: **admin@System-domain**  
Enter administrator's name: **admin**  
Enter new administrator's password: **VMware1234!**  
Confirm new administrator's password: **VMware1234!**  

> C:\Program Files\VMware\Infrastructure\SSOServer\utils>rsautil reset-admin-password  
> Enter master password: **********  
> Enter administrator's name: admin  
> Enter new administrator's password: ***********  
> Confirm new administrator's password: ***********  
> Password reset successfully  

![SSO master password ex](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_master_password_ex_ok.PNG)

再度パスワードを変更して、コマンドを実行する

```
cd /d C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli
ssolscli.cmd updateService -d https://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si C:\Certs\sts_id -ip C:\Certs\sts.properties
```
　<br />

> C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli>ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si c:\Certs\sts_id -ip c:\Certs\sts.properties  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51:7444/ims/STSService?wsdl  
> Service with name 'STS for Single Sign On' and ID '{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:2' was updated.  
> Return code is: Success  
> **0**

![SSO 7444 service1(STS) ok](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_service1_ok.PNG)

コマンドが成功したなら、続いて以下の２つのサービスも同様に置き換える  


ssolscli.cmd updateService -d https\://SSOServer.Domain:7444/lookupservice/sdk -u admin@System-Domain -p YourPassword -si C:\Certs\gc_id -ip C:\Certs\gc.properties  
ssolscli.cmd updateService -d https\://SSOServer.Domain:7444/lookupservice/sdk -u admin@System-Domain -p YourPassword -si C:\Certs\admin_id -ip C:\Certs\admin.properties  

> ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si c:\Certs\gc_id -ip c:\Certs\gc.properties

<span style="color: #f00;">**●ここでもまたエラーが発生します。以下の太字の部分で、FQDN にてアクセスされている為  <br />
 → DNS サーバがない場合は、 hosts ファイルにて名前解決をする必要がある**</span>


> C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli>ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si C:\Certs\gc_id -ip C:\Certs\gc.properties  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://**VCS51.testdev.local**:7444/ims/STSService  
> Unable to connect to server  
> Unable to connect to server  
> Return code is: ServiceNotResponding  
> **2**  

![SSO 7444 service1(GC) ng](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_service2_gc_ng.PNG)

以下のフォルダにて、notepad で hosts ファイルを以下の通りに修正する


***C:\Windows\System32\drivers\etc***  

(**hosts**)
```
# 192.168.1.100 VCS51    # Vmware vCenter Server  
192.168.1.100 VCS51    VCS51.testdev.local    # Vmware vCenter Server  
```

![SSO hosts ex](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_hosts_ex.PNG)

再度2つのサービス用のコマンドを実行する  


```
ssolscli.cmd updateService -d https://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si c:\Certs\gc_id -ip c:\Certs\gc.properties
```
　<br />

> C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli>ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si C:\Certs\gc_id -ip C:\Certs\gc.properties  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/ims/STSService  
> Service with name 'The group check interface of the SSO server' and ID '{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:3' was updated.  
> Return code is: Success  
> **0**  

![SSO 7444 service2(gc) ok](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_service2_gc_ok.PNG)

　<br />

```
ssolscli.cmd updateService -d https://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si c:\Certs\admin_id -ip c:\Certs\admin.properties
```
　<br />

> C:\Program Files\VMware\Infrastructure\SSOServer\ssolscli>ssolscli.cmd updateService -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234! -si C:\Certs\admin_id -ip C:\Certs\admin.properties  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/ims/STSService  
> Service with name 'The administrative interface of the SSO server' and ID '{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:1' was updated.  
> Return code is: Success  
> **0**  

![SSO 7444 service3(admin) ok](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_sso_service3_admin_ok.PNG)

　<br />


**これで Single Sign On(SSO)の更新は完了です。**  

続いて、「Inventory Service」 の更新ですが、以下うまくいかない場合の対処方法のいくつかを記載しておきます。
（※手順で発生した問題はその都度、解決方法を記載済み）  

-----


　<br/>
[(Next) → 5.Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_self"}



## “Return Code is: OperationFailed”
###### エラーが表示された場合は、問題が発生しています

[※参照元 → vCenter 5.1 U1 Installation: Part 3 (Install vCenter SSO SSL Certificate)](https://www.derekseaman.com/2012/09/vmware-vcenter-51-installation-part-3.html)


“unable to connect to server”（サーバーに接続できません）というエラーが表示された場合は、Single Sign On(SSO) Service を再起動して、2,3分待ってからもう一度お試しください。  

 **※使用している OpenSSL のバージョンに十分注意する必要があります**  
そうしないと、間違ったハッシュが生成される可能性があります。  
OpenSSL 1.x には、0.9.8 ツリーとは異なるデフォルトのハッシュ アルゴリズムがあります。  
以下に両方のコマンドを示しますが、参照元によれば、どちらも同じハッシュを生成します。  
適切な引数を使用していると仮定すると、0.9.8y、1.0.1c、1.0.1e は、すべて同じハッシュ結果になります。  
**vCenter Certificate Automation** ツールとの互換性を保つには、OpenSSL 0.9.8 のみを使用する必要があります。


1. Windows エクスプローラーで C:\ProgramData\VMware に移動し、**SSL** ディレクトリがあるかどうかを確認します。ない場合は、作成します (すべて大文字)。  

2. Root64.cer ファイルを C:\ProgramData\VMware\SSL にコピーし、名前を ca_certificates.crt に変更します。  
　※中間証明書がある場合は、ca_certificates.crt ファイルは [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"} で作った（中間証明＋ルート証明）である必要がある。
また、ca_certificates のファイル拡張子が「**cer**」ではなく「**crt**」で終わっていることを再確認してください。

3. 単一の証明書の場合は、Root64.cer ファイルのハッシュを計算します。  
もし、中間証明書がある場合は、この手順で Root64-1.cer (ルート証明書) のハッシュを計算します。  
OpenSSL 1.0.0 以降でこれを行うには、次のコマンドを使用します。

```
C:\OpenSSL-Win32\bin\openssl x509 -subject_hash_old -noout -in C:\Certs\Root64.cer
```
1.0.0 より前の 0.9.8 を使っているなら

```
C:\OpenSSL-Win32\bin\openssl x509 -subject_hash -noout -in C:\Certs\Root64.cer
```

> C:\OpenSSL-Win32\bin\openssl x509 -subject_hash -noout -in C:\Certs\Root64.cer  
> **f8****51**

4. もし、中間証明書を使わない単独の証明書なら、ハッシュ値のファイル名に、拡張子０と言うようにリーネームする。
単一の CA (中間 CA なし) を使用している場合は、Root64.cer ファイルを SSL ディレクトリにコピーし、前の手順のハッシュ値を使用して名前を変更し、ファイル拡張子を 0 (ゼロ) にします。  
　<br />
たとえば、[SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"} で作成した D:\certs\root64.cer を SSL フォルダーにコピーし、名前を **f8****51\.0** に変更します。  

-----


　<br/>
[(Next) → 5. Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_self"}
