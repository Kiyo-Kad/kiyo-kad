---
title: vCenter 5.1 証明書期限切れ対応(vCenter Server)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(vCenter Server)
date: 2024-08-07T13:41:30+09:00
tags: ["vcenter5.1", "certificate expried", "vCenter Server", "vCO"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(vCenter Server)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. [Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">vCenter Server (VirtualCenter Server)</span>
1. [vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_blank"}
1. [vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_blank"}
1. Update Manager (未確認…本環境ではインストールしていません)
:::

### ■確認事項
::: info ※以下確認してください
+ 時間は戻っていますか？
+ vCenter Server 系のサービス起動中ですか？
+ SSO (vCenter Single Sign On)Part3, Inventory Service は完了していますか？
:::

## vCenter Server (VirtualCenter Server) の SSL 証明書の置き換え

1. 3ファイル (**rui.crt**, **rui.key**, **rui.pfx**) のバックアップ
```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
mkdir %CopyFolderCuren%\[vCO][1]%folderName%_VMware_VirtualCenter_SSL
copy "C:\ProgramData\VMware\VMware VirtualCenter\SSL"\*.* %CopyFolderCuren%\[vCO][1]%folderName%_VMware_VirtualCenter_SSL
```

2. 新しい証明書ファイルを **C:\Certs\vCenter** から **C:\ProgramData\VMware\VMware VirtualCenter\SSL** へ上書きコピーする。  

※ Windows Server 2008, Windows Server 2003 によってフォルダは異なる  
　  
In Windows Server 2008 - C:\ProgramData\VMware\VMware VirtualCenter\SSL
In Windows Server 2003 - C:\Documents and Settings\All Users\Application Data\VMware\VMware VirtualCenter\SSL

```
copy /Y C:\Certs\vCenter\rui.crt "C:\ProgramData\VMware\VMware VirtualCenter\SSL"
copy /Y C:\Certs\vCenter\rui.key "C:\ProgramData\VMware\VMware VirtualCenter\SSL"
copy /Y C:\Certs\vCenter\rui.pfx "C:\ProgramData\VMware\VMware VirtualCenter\SSL"
```

3. ブラウザで、**https\://localhost/mob/?moid=vpxd-securitymanager&vmodl=1** にアクセスする。 (vCenter Server Managed Object Browser (MOB))  

```
https://localhost/mob/?moid=vpxd-securitymanager&vmodl=1
```

　「... セキュリティ証明書には問題があります。」の警告が出るが、「このサイトの閲覧を継続する（推奨されません）。」をクリックする。

![vcs51 vcenter MOB 1 continue](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_MOB_1_continue.PNG)

4. 「セキュリティの警告」のダイアログが出るが、「はい」をクリックする。

![vcs51 vcenter local warning](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_local_warning.PNG)

5. 「Windows セキュリティ」のダイアログに、このサーバ (VCS51) の管理者権限のユーザー (administrator) とパスワードでログインする。

![vcs51 vcenter localhost auth2](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_localhost_auth2.PNG)

6. 「Managed Object Browser」の **reloadSslCertificate** をクリックする。

![vcs51 vcenter MOB 01](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_MOB_01.PNG)

7. 続いて、**Invoke Method** をクリックする。  

![vcs51 vcenter MOB 02 Invoke](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_MOB_02_Invoke.PNG)

8. 成功すると、**Method Invocation Result: void** と表示されるので、両方の Windows （ブラウザ）を閉じてください。  

![vcs51 vcenter MOB 03 Invoke_void](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_MOB_03_Invoke_void.PNG)

　<br />

9. 以下のディレクトリに移動します。

```
cd /d C:\Program Files\VMware\Infrastructure\VirtualCenter Server\isregtool
```

10. vCenter Service と Inventory Service への登録コマンドを実行します。  

register-is.bat vCenter_Server_URL Inventory_Service_URL SSO_Lookup_Service_URL  

+ Where these URLs are the typical URL (modify if ports are different):  
vCenter_Server_URL is https\://server.domain.com/sdk  
Inventory_Service_URL is https\://server.domain.com:10443/  
SSO_Lookup_Service_URL is https\://server.domain.com:7444/lookupservice/sdk  


```
register-is.bat https://VCS51/sdk https://VCS51:10443/ https://VCS51:7444/lookupservice/sdk
```

11. コマンドラインに処理メッセージが多数表示されるが、以下のように **0**　**0** と表示されれば成功です。

> Successfully completed register operation
> Removing Client@526301960 reference from CompiledHttpConfiguration@1924550782, 0 active clients left.  
> Shutting down CompiledHttpConfiguration@1924550782 as there are no more clients.  
>  <br />
> Removing Client@1019249725 reference from CompiledHttpConfiguration@317065876, 0 active clients left.  
> Shutting down CompiledHttpConfiguration@317065876 as there are no more clients.  
> Client was disposed successfully  
> Registration completed  
> Finished performing register action  
> **0**  
> **0**  

![vcs51 vcenter register-is](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_register-is.PNG)

※ もしエラーになる場合は、３つのサービスの URL タイプミスが考えられます。  
　あるいは、vCenter Server の default ディレクトリと異なるかです。  

C:\Program Files\VMware\Infrastructure\VirtualCenter Server\  

vpxd -r  

vCenter Server のデータベースのユーザーパスワードを入力して、新しい証明書でパスワードを暗号化します。

　<br />


----------


12. ３つのサービスを再起動します。  
**VMware VirtualCenter Server**,  
**VMware VirtualCenter Management Webservices** (※STOPは vCenter に連動),  
**VMware vSphere Profile-Driven Storage Servive**  

::: info 補足
特に以下の3サービス再起動しなくても、VCenterServer の証明書は更新される。  
その為、他の更新作業で再起動を実施してもよい。→ vSphere Web Client, Log Browser
:::

サービスを選び、右クリックして、「停止」をクリックする。

![vcs51 vcenter service stop1](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_service_stop1.PNG)

「別のサービスの停止」は、「はい」をクリックします。

![vcs51 vcenter vcs_management stop](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_vcs_management_stop.PNG)

2サービスとも停止したことを確認します。

![vcs51 vcenter vcs stop2 services](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_vcs_stop2_services.PNG)

「VMware VirtualCenter Server」 サービスを右クリックして、「開始」をクリックする。

![vcs51 vcenter service start](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_service_start.PNG)

上記が起動するのに、数分(2分程度)かかる。『開始』が表示された後、「VMware VirtualCenter Management Webservices」を右クリックして、「開始」をクリックする。  
※「停止」は、自動連動で停止されるが、「開始」は、個々に実施する必要がある


![vcs51 vcenter management start](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_management_start.PNG)

「VMware vSphere Profile-Driven Storage Servive」を右クリックして、「再起動」をクリックする。  
※右クリック「停止」、「開始」でも可能。  また、左の「サービスの再起動」でも可能です。

![vcs51 vcenter storage service restart2](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_storage_service_restart2.PNG)

　<br />

13. ブラウザで、「**https\://vcenterserver.domain.com/**」にアクセスして、「鍵アイコン / 証明書」をクリックして、サーバ証明書の「有効期間」が更新されていることを確認する。  

```
https://vcs51/
```


![vcs51 vcenter vcs51 brows01](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vcenter_vcs51_brows01.PNG)

※例では、有効期間が **2037年4月...** になっていたらOKです。

![SSO Certificate update](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_SSO_Certificate_update_1.PNG)


-----


　<br/>
[(Next) → 7. vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_self"}

