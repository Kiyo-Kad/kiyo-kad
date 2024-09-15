---
title: vCenter 5.1 証明書期限切れ対応(vSphere Web Client & Log Browser)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(vSphere Web Client & Log Browser)
date: 2024-08-10T13:51:50+09:00
tags: ["vcenter5.1", "certificate expried", "vSphere Web Client", "Log Browser"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(vSphere Web Client & Log Browser)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. [Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_blank"}
1. [vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_blank"}
1. [vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">vSphere Web Client & Log Browser</span>
1. Update Manager (未確認…本環境ではインストールしていません)
:::

### ■確認事項
::: info ※以下確認してください
+ 時間は戻っていますか？
+ vCenter Server 系のサービス起動中ですか？
+ SSO (vCenter Single Sign On)Part3, Inventory Service の更新は完了していますか？
+ vCenter Server (VirtualCenter Server) の更新は完了していますか？
:::

## vSphere Web Client & Log Browser の SSL 証明書の置き換え


1. vSphere Web Client の証明書 (rui.crt, rui.key, rui.pfx) をバックアップします。  


```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
mkdir %CopyFolderCuren%\[WebCl-LogBrow][1]%folderName%_VMware_vSphere_WebClient_SSL
copy "C:\ProgramData\VMware\vSphere Web Client\ssl"\*.* %CopyFolderCuren%\[WebCl-LogBrow][1]%folderName%_VMware_vSphere_WebClient_SSL
```

2. 「vSphere Web Client service」と「 Log Browser service」のサービスをストップする

3. 証明書を以下のディレクトリにコピーする  


C:\ProgramData\VMware\vSphere web client\ssl  


```
copy /Y C:\Certs\WebClient\rui.crt "C:\ProgramData\VMware\vSphere Web Client\ssl"
copy /Y C:\Certs\WebClient\rui.key "C:\ProgramData\VMware\vSphere Web Client\ssl"
copy /Y C:\Certs\WebClient\rui.pfx "C:\ProgramData\VMware\vSphere Web Client\ssl"
```


4. Log Browser の証明書 (rui.crt, rui.key, rui.pfx) をバックアップします。  

C:\Program Files\VMware\Infrastructure\vSphereWebClient\logbrowser\conf


```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
set mkPath=%CopyFolderCuren%\[WebCl-LogBrow][2]%folderName%_VMware_logbrowser_conf
mkdir %mkPath%
set orgPath="C:\Program Files\VMware\Infrastructure\vSphereWebClient\logbrowser\conf"
copy %orgPath%\*.* %mkPath%
```


5. 同様に証明書を以下のディレクトリにコピーする  

```
copy /Y C:\Certs\LogBrowser\rui.crt %orgPath%
copy /Y C:\Certs\LogBrowser\rui.key %orgPath%
copy /Y C:\Certs\LogBrowser\rui.pfx %orgPath%
```


6. SSO で登録されている Web Client の登録を以下のコマンドで解除します。  

set JAVA_HOME=c:\Program Files\VMware\Infrastructure\JRE  
cd /d C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool  
regTool.cmd unregisterService -si "C:\Program Files\VMware\Infrastructure\vSphereWebClient\serviceId" -d https\://SSOServer.domain:7444/lookupservice/sdk -u admin@System-Domain -p YourPassword  


```
SET JAVA_HOME=C:\Program Files\VMware\Infrastructure\jre
cd /d C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool

regTool.cmd unregisterService -si "C:\Program Files\VMware\Infrastructure\vSphereWebClient\serviceId" -d https://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234!
```

> C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool>regTool.cmd unregisterService -si "C:\Program Files\VMware\Infrastructure\vSphereWebClient\serviceId" -d https\://VCS51:7444/lookupservice/sdk -u admin@System-Domain -p VMware1234!  
> Intializing registration provider...
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/ims/STSService  
> Service with id "{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:7" is successfully unregistered  
> Service with id "{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:8" is successfully unregistered  
> Return code is: Success  
> **0**  


　<br />


7. 以下のコマンドで、サービスを登録します。  
　※注意： ディレクトリパスは**大文字と小文字が区別される**ので、システムにあるものと正確に一致していることを確認してください。特に、「**ssl**」ディレクトリはすべて小文字にする必要がある場合があります。


regTool.cmd registerService \--cert "C:\ProgramData\VMware\vSphere Web Client\ssl" \--ls-url https\://SSOServer.domain:7444/lookupservice/sdk \-username admin@System-Domain  \--password YourPassword  \--dir "C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool\sso_conf" \--ip "*.*" \--serviceId-file "C:\Program Files\VMware\Infrastructure\vSphereWebClient\serviceId"  


```
regTool.cmd registerService --cert "C:\ProgramData\VMware\vSphere Web Client\ssl" --ls-url https\://VCS51:7444/lookupservice/sdk -username admin@System-Domain --password VMware1234! --dir "C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool\sso_conf" --ip "*.*" --serviceId-file "C:\Program Files\VMware\Infrastructure\vSphereWebClient\serviceId"
```

　成功すると、以下のように表示されます。

> C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool>regTool.cmd registerService --cert "C:\ProgramData\VMware\vSphere Web Client\ssl" --ls-url https\://VCS51:7444/lookupservice/sdk -username admin@System-Domain --password VMware1234! --dir "C:\Program Files\VMware\Infrastructure\vSphereWebClient\SsoRegTool\sso_conf" --ip "*.*" --serviceId-file "C:\Program Files\VMware\Infrastructure\
> vSphereWebClient\serviceId"  
> Intializing registration provider...  
> Getting SSL certificates for https\://VCS51:7444/lookupservice/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/sso-adminserver/sdk  
> Getting SSL certificates for https\://VCS51.testdev.local:7444/ims/STSService  
> Service with name 'VMware Log Browser' was registered with ID: <span style="color: #808000;">**'{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:9'**</span>  
> Appending serviceId to file  
> Service with name 'VMware vSphere Web Client' was registered with ID: <span style="color: #808000;">**'{FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:10'**</span>  
> Appending serviceId to file  
> Certificates saved successfully  
> Return code is: Success  
> **0**  


![vcs51 web client & log bowser register](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_client_log_bowser_register.png)


8. **C:\Program Files\VMware\Infrastructure\vSphereWebClient** に移動して、 **ServiceID** ファイルをメモ帳等で開きます。  
そして、前の登録手順で、表示された2つの ID （ここでは黄色のハイライトの 9, 10）を残して、全てを削除します。  


C:\Program Files\VMware\Infrastructure\vSphereWebClient  

serviceId ファイルを開きます。  


> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:7  
> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:8  
> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:9  
> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:10  

![vcs51 web client service_id 4ids](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_client_service_id_01.png)

以下のように編集して保存します。

> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:9  
> {FA0AB650-7AB3-4D86-8577-E5AF96FC8B3C}:10  

![vcs51 web client service_id 2ids](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_client_service_id_02.png)


9. vSphere Web Client services と Log Browser services を再起動します。  
　※サービスが完全に起動するまで、5分ぐらい待ちます。  


vSphere Web Client, Log Browser をそれぞれ右クリック、「停止」→「開始」を押します。
![vcs51 web client_service_rdy](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_client_service_rdy.png)

vSphere Web Client の「停止」、「開始」
![vcs51 web client service_stop](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_client_service_stop.png)

続いて、Log Browser の「停止」、「開始」
![vcs51 log browser service_stop](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_log_browser_service_stop.png)

　※サービスが完全に起動するまで、5分ぐらい待ちます。  

　<br />

10. ブラウザで、vSphere Web Client にログインします。  

※ VCS51 サーバの管理者権限： **administrator** 等  

```
https://vcs51:9443/vsphere-client/
```

![vcs51_web_client_login_admin](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_web_client_login_admin.png)

※「**https\://vcenterserver.domain.com:9443/vsphere-client/**」にアクセスして、「鍵アイコン / 証明書」をクリックして、サーバ証明書の「有効期間」が更新されていることを確認する。  
※例では、有効期間が 2037年4月... になっていたらOKです。

![SSO Certificate update](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_SSO_Certificate_update_1.PNG)


<span style="color: #800000;">**（補足）ただし、SSO admin account ではなく、vCenter admin account を利用します。**  
　Log Browser を開き、エラーが無く利用可能なログを確認できるはずです。</span>  
　<br />
　※本手順では、確認できるスクリーンショットを取得できていません。  
　　参照元にある手順では、ESXi の証明書を更新するが、ここでは割愛ています。  

　　→ [参照リンク確認]  [vCenter 5.1 Installation: Part 15 (ESXi SSL certificate)](https://www.derekseaman.com/2013/02/vmware-vcenter-51-installation-part-15.html)

## 時間を元に戻す  

[Server 2008 R2]
```
net start "VMTools"
```

※以下の手順が望ましい


「VMTools」のサービス右クリック「プロパティ」、「無効」を「自動」に変更する。  

![vcs51 VMTools invalid](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_VMTools_invalid.PNG)

「プロパティ」をクリックする。

![vcs51 VMTools properties](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_VMTools_properties.PNG)

「無効」→「自動」に変更する。

![vcs51 VMTools Auto Ex](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_VMTools_Auto_Ex.PNG)

![vcs51 VMTools Auto OK](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_VMTools_Auto_OK.PNG)

##### サーバーを再起動することで、時間が元（NOWの日付）に戻る。

※物理機の場合は、タスクトレイの「時間」を右クリックして、「日付と時刻の調整」にて、時間を元に戻す。こちらも再起動を実施しする。  

　<br />

**各 VMware 系サービスが起動することを確認する。**  

　これで証明書の置き換えは、完了です。お疲れ様でした...。

