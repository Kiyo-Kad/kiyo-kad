---
title: vCenter 5.1 証明書期限切れ対応(vCenter Orchestrator)
description: vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応(vCenter Orchestrator)
date: 2024-08-09T10:30:30+09:00
tags: ["vcenter5.1", "certificate expried", "vCenter Orchestrator", "vCO"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応(vCenter Orchestrator Server)(vCO)

::: tip ■証明書更新対象サービス （この順番に処理する, CA作成含）
1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. [Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_blank"}
1. [vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_blank"}
1. <span style="color: green; font-size: 1.2rem; font-weight: bold;">vCenter Orchestrator Server (vCO)</span>
1. [vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_blank"}
1. Update Manager (未確認…本環境ではインストールしていません)
:::

### ■確認事項
::: info ※以下確認してください
+ 時間は戻っていますか？
+ vCenter Server 系のサービス起動中ですか？
+ SSO (vCenter Single Sign On)Part3, Inventory Service の更新は完了していますか？
+ vCenter Server (VirtualCenter Server) の更新は完了していますか？
:::

## vCenter Orchestrator Server(vCO) の SSL 証明書の置き換え



1. キーストアファイル **jssecacerts** のバックアップを取得します。  
　続いてファイルをリネーム (jssecacerts → jsse_cacerts_\********) します。  
　※ファイル名文字列での処理干渉を防ぐために「_」を途中に入れています。  

```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
set DestFullFolderName=%CopyFolderCuren%\[vCO][1]%folderName%_vCO_jre_lib_security
mkdir %DestFullFolderName%\
copy "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\*.* %DestFullFolderName%
<!-- rename "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\jssecacerts jsse_cacerts_%date:~0,3%4%date:~5,2%%date:~8,2%bak -->
rename "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\jssecacerts jsse_cacerts_backup
```


2. 秘密鍵をインポートして、jssecacerts キーストアファイルを作成します。  

keytool -importkeystore -srckeystore "custom.pfx" -srcstoretype pkcs12 -srcstorepass dunesdunes -deststoretype jks -destkeystore "/etc/vco/app-server/security/jssecacerts" -deststorepass dunesdunes  


```
set ExeKeyToolPath="C:\Program Files\VMware\Infrastructure\Orchestrator\jre\bin\keytool.exe"
Set Cert_Path=C:\Certs
set vCO_Path=%Cert_Path%\Orchestrator
set vCOsecPath="C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"

%ExeKeyToolPath% -importkeystore -srckeystore %vCO_Path%\rui.pfx -srcstoretype pkcs12 -srcstorepass testpassword -deststoretype jks -destkeystore %vCOsecPath%\jssecacerts -deststorepass dunesdunes
```


> C:\Certs>%ExeKeyToolPath% -importkeystore -srckeystore %vCO_Path%\rui.pfx -srcstoretype pkcs12 -srcstorepass testpassword -deststoretype jks -destkeystore %vCOsecPath%\jssecacerts -deststorepass dunesdunes  
> 別名 rui のエントリのインポートに成功しました。  
> インポートコマンドが完了しました:  1 件のエントリのインポートが成功しました。0 件のエントリのインポートが失敗したか取り消されました  

![vcs51 vCO KeyStore import](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_KeyStore_import.png)


3. インポートした秘密鍵のエイリアスを **dunes** に変更します。

```
%ExeKeyToolPath% -changealias -alias "rui" -destalias "dunes" -keystore %vCOsecPath%\jssecacerts -storetype jks -storepass dunesdunes
```

> C:\Certs>%ExeKeyToolPath% -changealias -alias "rui" -destalias "dunes" -keystore %vCOsecPath%\jssecacerts -storetype jks -storepass dunesdunes  
> \<rui\> の鍵パスワードを入力してください。: testpassword  


4. 次のコマンドで、続いて、インポートした秘密鍵のエントリーパスワードを jssecacerts keystore パスワード **dunsduns** と一致するように変更します。  

keytool -keypasswd -keystore jssecacerts -alias dunes  

Enter keystore password: dunesdunes  
Enter key password for \<dunes\>: \<certkeypass\>  
New key password for \<dunes\>: dunesdunes  
Re-enter new key password for \<dunes\>: dunesdunes  

　<br />

```
%ExeKeyToolPath% -keypasswd -keystore %vCOsecPath%\jssecacerts -alias dunes
```
> %ExeKeyToolPath% -keypasswd -keystore %vCOsecPath%\jssecacerts -alias dunes  
> キーストアのパスワードを入力してください:             **dunesdunes**  
> \<dunes\> の鍵パスワードを入力してください。            **testpassword**  
> 新規 \<dunes\> の鍵のパスワード:                        **dunesdunes**  
> 新規 \<dunes\> の鍵のパスワード を再入力してください:   **dunesdunes**  

![vcs51 vCO KeyStore passwaord change](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_KeyStore_passwaord_change.png)

　<br />

5. 新しい証明書が適切にインポートされていることを確認します。


keytool -keystore jssecacerts -v -list -alias dunes  

```
%ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -v -list -alias dunes
```

> %ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -v -list -alias dunes  
> キーストアのパスワードを入力してください:  
> 別名: dunes  
> 作成日: 2023/08/08  
> エントリタイプ: PrivateKeyEntry  
> 証明連鎖の長さ: 2  
> 証明書[1]:  
> 所有者: CN=VCS51.testdev.local, OU=VMwareOrchestrator, O=VMware, L=Palo Alto, ST=California, C=US  
> 発行者: EMAILADDRESS=support\@vmware.com, CN=VMware Code Signing CA, OU=http\://www.vmware.com/, O=VMware, ST=California, C=US  
> シリアル番号: 1006  
> ......
> 証明書[2]: 
> 所有者: EMAILADDRESS=support\@vmware.com, CN=VMware Code Signing CA, OU=http\://www.vmware.com/, O=VMware, ST=California, C=US  
> ......  
> ]  


6. 証明書エントリ タイプが **PrivateKeyEntry** であることを確認します。  
　そして、証明書が有効であり、拇印が期待どおりのものと一致していることを確認します。  
　次のコマンドを実行して証明書署名要求を生成し、dunes 秘密鍵の keypasswd (dunesdunes) が正しいことを確認します。  


keytool -keystore jssecacerts -certreq -alias dunes -v  

```
%ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -certreq -alias dunes -v
```

> Enter keystore password:  
> Enter key password for \<dunes\>:  
> You see a new Certificate Request being generated:  
>  
> \-----BEGIN NEW CERTIFICATE REQUEST-----  
> ………………………….  
> \-----END NEW CERTIFICATE REQUEST-----  


7. jssecacerts のキーストアに dunes の証明書があることを確認する。

```
%ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -list -storepass "dunesdunes"
```

> %ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -list -storepass "dunesdunes"  
>   <br />
> キーストアのタイプ: JKS  
> キーストアのプロバイダ: SUN  
>   <br />
> キーストアには 1 エントリが含まれます。  
>   <br />
> dunes, 2023/08/08, PrivateKeyEntry,  
> 証明書のフィンガープリント (MD5): 4F:81:D8:1E:BF:B1:...  


## jssecacerts のキーストアの別名と順序を調べる


::: info ■JKS キーストアのチェーンの作り方

<span style="color: #f00;">**1. 既存の jssecacerts を確認して、『エントリー数』と、『別名』、そして、登録順序（重要ではない）を確認する。→ 9.  
   2. 1. で確認した別名と順序（中間証明書, SSO, vCenter）で、秘密鍵を登録します。→ 10.  
   ※「証明書」と「別名」の設定は、以下で確認済  
   　[1] dunes (すでに登録済)  
   　[2] 中間証明書 → _imported__1  
   　[3] SSO → \_imported\_  
   　[4] vCenter → _imported__2**</span>
:::

8. 現行のキーストアから、別名と証明書の関係を調べます。  

　<span style="color: #f0f;">※以下から **4** エントリーであることがわかる。  
　２つの「証明書」と「別名」との関係は、VMware vCenter Certificate Automation Tool の vCenter Orchestrator(vCO) のアップデート手順に準拠する。  
　よって、**\_imported\_** が **SSO** となります。また、登録順序も同様に決まっています。</span>  



keytool -keystore jssecacerts -list -storepass "dunesdunes"  


```
%ExeKeyToolPath% -keystore "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\jsse_cacerts_240809bak -list -storepass "dunesdunes"
```

> %ExeKeyToolPath% -keystore "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\jsse_cacerts_240809bak -list -storepass "dunesdunes"  
>  <br />
> キーストアのタイプ: JKS  
> キーストアのプロバイダ: SUN  
> <br />
> キーストアには 4 エントリが含まれます。  
> <br />
> ssl:_**imported__2** , 2014/03/18, trustedCertEntry,  
> 証明書のフィンガープリント (MD5): FC:F7:65:95:96:66:...  
> ssl:_**imported_** , 2014/03/18, trustedCertEntry,  
> 証明書のフィンガープリント (MD5): FC:ED:98:CD:F5:CB:...  
> ssl:_**imported__1** , 2014/03/18, trustedCertEntry,  
> 証明書のフィンガープリント (MD5): 09:15:7D:87:D8:BA:...  
> **dunes** , 2023/07/17, PrivateKeyEntry,
> 証明書のフィンガープリント (MD5): 62:DF:32:D4:64:2E:...  


　※詳細（証明書と別名が表示されている）をさらに確認する

　<br />
```
%ExeKeyToolPath% -keystore "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\jssecacerts jsse_cacerts_backup -list -v -storepass "dunesdunes"  
```


> C:\Certs>%ExeKeyToolPath% -keystore "C:\Program Files\VMware\Infrastructure\Orchestrator\jre\lib\security"\jssecacerts jsse_cacerts_backup -list -v -storepass "dunesdunes"  
> <br />
> キーストアのタイプ: JKS  
> キーストアのプロバイダ: SUN  
> <br />
> キーストアには 4 エントリが含まれます。  
> <br />
> 別名: ssl: **_imported__2**  
> 作成日: 2014/03/18  
> エントリのタイプ: trustedCertEntry  
> 所有者: EMAILADDRESS=support\@vmware.com, CN=VMware default certificate, OU=vCenterServer_2014.03.18_190459, O="VMware, Inc."  
> 発行者: EMAILADDRESS=support\@vmware.com, CN=VCS51, **OU=vCenterServer_2014.03.18_190459** , O="VMware, Inc."  
> シリアル番号: 100002  
> ......  
> \*******************************************  
> \*******************************************  
> <br />
> 別名: ssl: **\_imported\_**  
> 作成日: 2014/03/18  
> エントリのタイプ: trustedCertEntry  
> 所有者: CN=VCS51  
> 発行者: CN=RSA Identity and Access Toolkit Root CA  
> シリアル番号: 144d49ede57  
> ......  
> 拡張:  
> #1: ObjectId: 2.5.29.19 Criticality=true  
> BasicConstraints:[  
>   **CA:false**  
>   PathLen: undefined  
> ]  
> ......  
> \*******************************************  
> \*******************************************  
> <br />
> 別名: ssl: **_imported__1**  
> 作成日: 2014/03/18  
> エントリのタイプ: trustedCertEntry  
> 所有者: CN=RSA Identity and Access Toolkit Root CA  
> 発行者: CN=RSA Identity and Access Toolkit Root CA  
> シリアル番号: 144d49edcf0  
> ......  
> 拡張:  
> #1: ObjectId: 2.5.29.19 Criticality=true  
> BasicConstraints:[  
>   **CA:true**  
>   PathLen:2147483647  
> ]  
> \*******************************************  
> \*******************************************  
> <br />
> 別名: dunes  
> 作成日: 2023/07/17  
> エントリタイプ: PrivateKeyEntry  
> 証明連鎖の長さ: 1  
> 証明書[1]:  
> 所有者: CN=VCS51, OU=VMware, O=VMware, C=US  
> 発行者: CN=VCS51, OU=VMware, O=VMware, C=US  
> シリアル番号: 189625ec1e5  
> .....  
> \*******************************************  
> \*******************************************  

　<br />


9. キーストアに３つの証明書を順次登録します。

##### 9-1. 中間証明書  


```
%ExeKeyToolPath% -importcert -noprompt -trustcacerts -keystore %vCOsecPath%\jssecacerts -deststoretype JKS -storepass "dunesdunes" -keypass testpassword -file C:\Certs\Root64-2.cer -alias "ssl:_imported__1"
```

> C:\Certs>%ExeKeyToolPath% -importcert -noprompt -trustcacerts -keystore %vCOsecPath%\jssecacerts -deststoretype JKS -storepass "dunesdunes" -keypass testpassword -file C:\Certs\Root64-2.cer -alias "ssl:_imported__1"  
> 証明書がキーストアに追加されました。  

![vcs51 vCO KeyStore import intermidiate ca](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_KeyStore_import_intermidiate_ca.png)


##### 9-2. SSO  


```

%ExeKeyToolPath% -importcert -keystore %vCOsecPath%\jssecacerts -deststoretype JKS -storepass "dunesdunes" -keypass testpassword -file C:\Certs\SSO\rui.crt -alias "ssl:_imported_"
```

「この証明書を信頼しますか?」**yes** と入力して Enter を押す。  

> C:\Certs>%ExeKeyToolPath% -importcert -keystore %vCOsecPath%\jssecacerts -deststoretype JKS -storepass "dunesdunes" -keypass testpassword -file C:\Certs\SSO\rui.crt -alias "ssl:_imported_"  
> 所有者: CN=VCS51.testdev.local, OU=vCenterSSO, O=VMware, L=Palo Alto, ST=California, C=US  
> 発行者: EMAILADDRESS=support\@vmware.com, CN=VMware Code Signing CA, OU=http\://www.vmware.com/, O=VMware, ST=California, C=US  
> シリアル番号: 1002  
> ......  
> この証明書を信頼しますか? [no]:  **yes**  
> 証明書がキーストアに追加されました。  

![vcs51 vCO KeyStore import sso ssl](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_KeyStore_import_sso_ssl.png)

##### 9-3. vCenter  


```
%ExeKeyToolPath% -importcert -keystore %vCOsecPath%\jssecacerts -deststoretype JKS -storepass "dunesdunes" -keypass testpassword -file C:\Certs\vCenter\rui.crt -alias "ssl:_imported__2"
```

「この証明書を信頼しますか?」に **yes** と入力して Enter を押す。  

> C:\Certs>%ExeKeyToolPath% -importcert -keystore %vCOsecPath%\jssecacerts -deststoretype JKS -storepass "dunesdunes" -keypass testpassword -file C:\Certs\vCenter\rui.crt -alias "ssl:_imported__2"  
> 所有者: CN=VCS51.testdev.local, OU=vCenterServer, O=VMware, L=Palo Alto, ST=California, C=US  
> 発行者: EMAILADDRESS=support\@vmware.com, CN=VMware Code Signing CA, OU=http\://www.vmware.com/, O=VMware, ST=California, C=US  
> シリアル番号: 1000  
......  
> この証明書を信頼しますか? [no]: **yes**  
> 証明書がキーストアに追加されました。  

![vcs51 vCO KeyStore import vcenter ssl](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_KeyStore_import_vcenter_ssl.png)

　<br />

##### 9-4. 登録できた証明書を確認します。

```
%ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -list -v -storepass "dunesdunes"
%ExeKeyToolPath% -keystore %vCOsecPath%\jssecacerts -list -storepass "dunesdunes"

```


10. vCenter Orchestrator (vCO), vCO Configuration サービスを再起動します。  

　※vCenter Orchestrator (vCO) サービスの再起動に4分程度かかる。  

![vcs51 vCO Service 01](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_Service_01.png)

![vcs51 vCO config service start](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_config_service_start.png)




　※1. jssecacerts のリネームの影響で、vCO サービスを落とす時にエラーが出る場合があるが特に問題はない。  

![vcs51 vCO service stop error](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_service_stop_error.png)


※サービスの再起動に4分程度かかる（プログレスバーの進みが遅い）。  
※もしエラーで落ちる場合は、以下のログを確認すること。  

C:\Program Files\VMware\Infrastructure\Orchestrator\app-server\server\vmo\log\server.log


![vcs51 vCO Service start](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_Service_start.png)


　<br />

11. 「**https\://vcenterserver:8281/**」にアクセスして、「鍵アイコン / 証明書」をクリックして、サーバ証明書の「有効期間」が更新されていることを確認する。  


```
https://vcs51:8281/
```

![vcs51 vCO Browser 01](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_Browser_01.png)

※例では、有効期間が 2037年4月... になっていたらOKです。

![SSO Certificate update](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_SSO_Certificate_update_1.PNG)


12. ログをバックアップします。


```
set folderName=%date:~0,3%4%date:~5,2%%date:~8,2%-y
set CopyFolderCuren=C:\Certs\zCmd_%folderName%
set DestFullFolderName=%CopyFolderCuren%\[vCO][2]%folderName%_vCO_app-svsv_vmo_log
mkdir %DestFullFolderName%\
copy "C:\Program Files\VMware\Infrastructure\Orchestrator\app-server\server\vmo\log"\*.* %DestFullFolderName%
```

> C:\Program Files\VMware\Infrastructure\Orchestrator\app-server\server\vmo\log\server.log

※ server.log を開くと以下のようにログが記載されていれば、OKです。

![vcs51 vCO start log charactors](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vCO_start_log_charactors.png)


-----


　<br/>
[(Next) → 8. vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_self"}

