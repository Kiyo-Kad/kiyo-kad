---
title: vCenter 5.1 証明書期限切れ対応(Inventory Service)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(Inventory Service)
date: 2024-08-05T17:23:40+09:00
tags: ["vcenter5.1", "certificate expried", "Inventory Service"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(Inventory Service)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">Inventory Service</span>
1. [vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_blank"}
1. [vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_blank"}
1. [vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_blank"}
1. Update Manager (未確認…本環境ではインストールしていません)
:::

### ■確認事項
::: info ※以下確認してください
+ 時間は戻っていますか？
+ vCenter Server 系のサービス起動中ですか？
+ SSO (vCenter Single Sign On)Part3 は完了していますか？
:::



## Inventory Service の SSL 証明書の置き換え

1. 最初のステップは、vCenter SSO service から、Inventory service を未登録にします。  
　以下のディレクトリに移動して、次のコマンドを入力します。  

```
cd /d C:\Program Files\VMware\Infrastructure\Inventory Service\scripts
```

unregister-sso.bat https\://YourServer.FQDN:7444/lookupservice/sdk admin@System-Domain YourPassword

```
unregister-sso.bat https://VCS51:7444/lookupservice/sdk admin@System-Domain VMware1234!
```

> C:\Program Files\VMware\Infrastructure\Inventory Service\scripts>unregister-sso.bat https\://VCS51:7444/lookupservice/sdk admin@System-Domain VMware1234!  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/ims/STSService  
> Return code is: Success  
> **0**  

![vcs51 inventory unregister sso](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_inventory_unregister_sso2.PNG)


正常終了したら、コマンドプロンプトは、そのままにしておく

2. “VMware vCenter Inventory Service”をストップする。

![vcs51 inventory service stop](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_inventory_service_stop.PNG)

3. 作成済みの証明書を以下のフォルダに上書きコピーする。  
　最初に、既存のファイルをバックアップします。  

```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
mkdir %CopyFolderCuren%\[Inventory][1]%folderName%_VMware_Infra_Inventory_Servece_ssl
copy "C:\ProgramData\VMware\Infrastructure\Inventory Service\ssl"\*.* %CopyFolderCuren%\[Inventory][1]%folderName%_VMware_Infra_Inventory_Servece_ssl
```

　次に、Inventory service 用の証明書ファイル 3 つ（**rui.crt**, **rui.key**, **rui.pfx**）を **C:\Certs\Inventory** から **C:\ProgramData\VMware\Infrastructure\Inventory Service\ssl** へ上書きコピーする。  

```
copy /Y C:\Certs\Inventory\rui.crt "C:\ProgramData\VMware\Infrastructure\Inventory Service\ssl"
copy /Y C:\Certs\Inventory\rui.key "C:\ProgramData\VMware\Infrastructure\Inventory Service\ssl"
copy /Y C:\Certs\Inventory\rui.pfx "C:\ProgramData\VMware\Infrastructure\Inventory Service\ssl"
```

4. “VMware vCenter Inventory Service”をスタートする。

![vcs51 inventory service start](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_inventory_service_start.PNG)

5. 2.同様に、以下のコマンドを実行して登録します。

register-sso.bat https\://YourServer.FQDN:7444/lookupservice/sdk admin@System-Domain YourPassword  

```
register-sso.bat https://VCS51:7444/lookupservice/sdk admin@System-Domain VMware1234!
```
成功したら、以下のようになるのを確認します。

> C:\Program Files\VMware\Infrastructure\Inventory Service\scripts>register-sso.bat https\://VCS51:7444/lookupservice/sdk admin@System-Domain VMware1234!  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/ims/STSService  
> Solution user with id: {Name: InventoryService_2014.03.18_190335, Domain: System-Domain} successfully registered  
> Successfully assigned role "RegularUser" to user "{Name: InventoryService_2014.03.18_190335, Domain: System-Domain}"  
> Return code is: Success  
> **0**  

![vcs51 inventory register sso ok](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_inventory_register_sso_ok2.PNG)

6. ブラウザで、以下の Inventory Service URL にアクセスし、証明書が更新されているかを確認する。  

https\://YourServer.FQDN:10443  

```
https://vcs51:10443/
```

> **HTTP Status 400 - Bad request error**

が出る（**これで OK です**）が、ブラウザの「鍵アイコン / 証明書」をクリックして、サーバ証明書の「有効期間」が更新されていることを確認する。  

![vcs51 inventory 10443 bad request](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_inventory_10443_bad_request.PNG)

※例では、有効期間が **2037年4月...** になっていたらOKです。

![SSO Certificate update](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_SSO_Certificate_update_1.PNG)

※念のために、「証明書」「詳細」タブで、「サブジェクト」を選択して、**OU = vCenterInventoryService** となっていればOKです。

![vcs51 inventory service SSL OU](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_Inventory_Service_SSL_OU.PNG)


おめでとうございます！  

Inventory Service SSL 証明書の更新が完了しました。

-----


　<br/>
[(Next) → 6. vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_self"}

