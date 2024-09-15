---
title: vCenter 5.1 証明書期限切れ対応
description: (旧)VMware vCenter Server 5.1 (5.1.0 Build 1115182) の「証明書期限切れ」対応
date: 2024-07-08T14:28:00+09:00
tags: ["vmware", "vcenter5.1", "certificate expried"]
prev: false
next: false
---

# vCenter Server 5.1 (5.1.0 Build: 1115182) の「証明書期限切れ」対応
## 証明書期限切れを起こしてしまった場合の対処方法

### ■はじめに

　最近のvCenter Server のバージョン(6.5で確認済)では、証明書更新は容易となっている。しかしながら、本バージョンは稼働から１０年を迎え、気づけば証明書有効期限（１０年）を過ぎていた。

本来ならば、証明書更新をサポートしてくれるツール(SSL Certificate Automation Tool 1.0)があるのですが、サポートが終わった本体パッケージやそれに関連するツールは、ダウンロードできない。
本期限切れ対応時開始時は、かろうじてvCenter 5.5用のバージョンはダウンロードできたが、各バージョン専用のため利用できない(**更新プランは参考までに利用可**)。
さらに検索すると「ツールがリリースされる前は手動で更新していた」との手掛かりからAI等にも相談しながら、ようやく**手動**で更新する方法を発見した。

（先達に感謝→ [Link](#■参照リンク)）

<mark>**手動**で実際に更新ができたので、備忘録的に残しておく。</mark>

一部の手順は、**参考サイトに記載がない方法**（証明書の作成とキーストア作成）で実施している。

かなりの難易度と、根気のいる作業なので、本手順を参考に更新作業をされる場合は、**失敗を前提に、バックアップや開発環境で事前に確認する**ことを強くおすすめします。

なお、おまけでOpenSSLで構築した(自己)認証局（CA: Certificate Authorities）で、サーバー証明書を作成し、IIS等のWEBサーバで利用する方法も合わせて記載しておきます。

※サーバー証明書を利用する理由ですが、Chrome/EdgeのブラウザでSSL通信時、SAN（Subject Alternative Name / サブジェクトの別名）の設定が入っていないサーバー証明書では、
**ERR_SSL_KEY_USAGE_INCOMPATIBLE** なるエラーが発生し、(開発)サイトにアクセスできない。そのために、SANの設定が入ったサーバー証明書を利用する必要がある。
そうでないと、SSL通信(https)ではサイトを表示してくれないので、開発時はSSL通信を利用しないか、現時点で通信可能なFirefoxを利用する必要があります。

&nbsp;  

---
#### ■システム環境
+ vCenter Server 5.1.0 + ESXi5.1.0 (Build: 1312873) x2 (非HA) (vCenter Server 5.1 はESXi内の仮想ゲスト)<br />
+ (仮想ゲスト) OS: Windows Server 2008 R2 Datacenter (Standard, Enterprise でも同等), CPUs: 4vCPUs, Memory: 12GB


***この方法でないと、証明書更新は不可***<br>
（もし方法をご存じな方がいらっしゃれば、ご教授ください）

<mark>***証明書が切れたサーバの時間を戻す***</mark>

&nbsp;  

---
#### ■証明書更新対象サービス （この順番に処理する, CA作成含）

1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_blank"}
    * [サーバー証明書の作成](../make-server-certificate/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part1)](../vcenter51-certificate-expired-Single-Sign-On-Part1/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part2)](../vcenter51-certificate-expired-Single-Sign-On-Part2/){target="_blank"}
1. [SSO (vCenter Single Sign On)(Part3)](../vcenter51-certificate-expired-Single-Sign-On-Part3/){target="_blank"}
1. [Inventory Service](../vcenter51-certificate-expired-Inventory-Service/){target="_blank"}
1. [vCenter Server (VirtualCenter Server)](../vcenter51-certificate-expired-vCenter-Server/){target="_blank"}
1. [vCenter Orchestrator Server (vCO)](../vcenter51-certificate-expired-vCenter-Orchestrator-Server-vCO/){target="_blank"}
1. [vSphere Web Client & Log Browser](../vcenter51-certificate-expired-vSphereWebClient-LogBrowser/){target="_blank"}
1. Update Manager (未確認…本環境ではインストールしていません)  

&nbsp;  

---
#### ■準備アプリとインストール時のパスワード

+ **OpenSSL Ver 0.98, 1.x** もOK → 上位バージョンは不可です（更新途中のハッシュ値生成のロジックが異なる為）[→Download](https://code.google.com/archive/p/openssl-for-windows/downloads)
+ **admin@System-Domain (Master Password)** → vCenter 5.1 をインストールした時に設定したパスワード  

※[OpenSSL Ver 0.98 win32 (Local-link)](../../dl/openssl-0.9.8k_WIN32.zip), [OpenSSL Ver 0.98 x64 (Local-link)](../../dl/openssl-0.9.8k_X64.zip)  

::: warning ご注意
<span style="color: #f00;">※パスワードがわからないと更新処理ができません  
万一忘れた場合、vCenter 5.1 の再インストールしか方法はありません</span>  
※検索すると、vCenter 5.1 が利用する SQL Server (DataBase) のパスワードテーブルのハッシュ値を変更してもダメです！！  
<span>VMware vSphere Web Client (SSO) ログインはできますが…</span>
:::

&nbsp;  

---
#### ■事前準備 （バックアップ, スタンドアローン化, 時間戻し, サービスの確認）
<span style="color:#f00;">　この（時間戻し）方法はリスクを伴いますので、必ずバックアップを取得し、さらに仮想ゲストの場合は、スナップショットを設定してください</span><br />

　※エキスポート取得して、他の仮想機でこの作業を実施する場合は、本番機と同等性能のマシンを使用してください<br />
*→恐らく起動処理がタイムアウトになるため、VirtualCenter Server サービスが起動しない場合がある(筆者環境では実際に起動しない場合ことを確認済)*

##### ●仮想ゲストの場合

+ 万一のデプロイ作業を想定して、バックアップが無い場合は、必ずエキスポートして、バックアップを作成しておいてください<br />

+ <span style="color:#f0f;">ESXi5.1.0 ホストが接続されている場合は、LANを生かしたまま、別のポートグループに変更し、ESXi5.1.0(2台とも)と通信できないようにする</span><br />

![VM-LANをDummyに変更](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_VMLan_Change_240709.PNG)

※正規LAN (VMware-LAN) から、ダミーLAN (VMware-Dummy-LAN)に切り替え

*<span style="color:#f00;">→仮想ホスト（ESXi5.1.0）が接続されていると、時間を戻したことより、更新手順で実施するVirtualCenter Server サービスの手動起動で、各種例外処理的なエラーが発生する
→更新途中で、VirtualCenter Server サービス が勝手に落ちる為<br />(落ちると以降の更新処理ができなくなる)</span>*

<!-- net stop "VMware Tools" (Server 2019) -->

[Server 2008 R2]

```
net stop "VMTools"
```

「VMTools」のサービス右クリック「プロパティ」、「自動」を「無効」に変更する（作業上誤って時間が戻るのを防ぐ）。  

![vCsサービスの全起動](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_bak_time_leap_service_started_vco.PNG)

|icon| icon の機能|
|---|---------|
| ![VMTool無効](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_vm_icon_invalid.PNG) | **VMTools 無効** |

※タスクトレイのアイコン[VMTool無効]はそのままにしておく（シームレスな行き来ができなくなるため）<br />

+ この後、時間を戻す(タスクトレイ、右クリック、「日付と時刻の調整」を選択して、<span style="color:#f00;">時間を証明書期限以前の日付</span>にする（年単位がおすすめ）

##### ●物理機の場合
+ True Image (Acronis) 等のHDD自身を全てバックアップするアプリを利用することを推奨（Windows Backup 等は未確認）<br />
+ 仮想機ゲストの場合同様、物理機でも、vCenter 5.1.0 はHub等に繋いだままにして、ESXi 5.1.0（２台とも）はLANを抜く<br />
+ この後、時間を戻す

&nbsp;  

![時間を戻す](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_time_bak_leap_setting.PNG)

※本事例では、作業日の１年前に戻した  

　その後サーバーを再起動して、VMware vCenter 5.1 系のサービスが上がるのを待つ　（マシンの性能にもよりますが、概ね10分程度かかる）

　「手動」起動になっている vCenter Orchestrator Configuration, vCenter Orchestrator Server (vCO) を起動する  
　※vCenter Orchestrator Server (vCO) がインストールされている場合のみ

![vCsサービスの全起動](https://kiyo-kad.github.io/kiyo-kad/images/vcs51/vcs51_bak_time_leap_service_started_vco.PNG)

&nbsp;  

(NEXT) → 1. [自己認証局(CA : Certificate Authorities)の作成](../vmware-vcenter51-certificate-expired-ca/){target="_self"}

&nbsp;  

#### ■参照リンク
+ [VMware vCenter Certificate Automation Tool による SSL 証明書の更新方法](https://ogawad.hatenablog.com/entry/20130524/1369355700)
+ [OpenSSL で認証局 (CA) を構築する手順 (Windows)](https://nodejs.keicode.com/nodejs/openssl-create-ca.php)
    + [OpenSSL で構築した認証局 (CA) でサーバ証明書を発行する方法](https://nodejs.keicode.com/nodejs/openssl-how-to-issue-certs.php#google_vignette)
+ [vCenter 5.1 U1 Install: Part 2 (Create vCenter SSL Certificates)](https://www.derekseaman.com/2012/09/vmware-vcenter-51-installation-part-2.html)
+ [vCenter 5.1 U1 Installation: Part 3 (Install vCenter SSO SSL Certificate)](https://www.derekseaman.com/2012/09/vmware-vcenter-51-installation-part-3.html)
<!-- + [vCenter 5.1 U1 Installation: Part 4 (Inventory Service Install)](https://www.derekseaman.com/2012/09/vmware-vcenter-51-installation-part-4.html) -->
+ [vCenter 5.1 U1 Installation: Part 5 (Inventory Service SSL Certificate)](https://www.derekseaman.com/2012/09/vmware-vcenter-51-installation-part-5.html)
+ [Configuring CA signed certificates for vCenter Server 5.1](https://knowledge.broadcom.com/external/article?legacyId=2035005)
+ [Configuring CA signed SSL certificates for the vSphere Web Client and Log Browser in vCenter Server 5.1](https://knowledge.broadcom.com/external/article?legacyId=2035010)
+ [Replacing expired vRO/vCO SSL certificate](https://knowledge.broadcom.com/external/article/344366/replacing-expired-vrovco-ssl-certificate.html)
+ [How to change the SSL certificate of WIndows installed vCO (SKKB1007)](https://kaloferov.com/blog/how-to-change-the-ssl-certificate-of-windows-installed-vco/)
+ [vCO Workflow to automate the certificate generation process (SKKB1003)](https://kaloferov.com/blog/vco-workflow-to-automate-the-certificate-generation-process/)
+ [Configuring CA signed SSL certificates for vSphere Update Manager in vCenter Server 5.1 and 5.5](https://knowledge.broadcom.com/external/article?articleNumber=328587)

