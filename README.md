# [RhythmFlow]

![Bot Status](https://img.shields.io/badge/Status-Online-brightgreen)
![Node.js Version](https://img.shields.io/badge/Node.js-v18.17.0%2B-green)
![Discord.js Version](https://img.shields.io/badge/Discord.js-v14-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📝 簡介

歡迎來到我的 Discord 音樂機器人專案！

這個專案是基於廣受好評的 **[iTzArshia/Discord-Music-Bot](https://github.com/iTzArshia/Discord-Music-Bot)** 進行開發與客製化的。我在其強大且穩定的基礎上，進行了一些修改與功能擴展，旨在提供更符合我個人需求的音樂播放體驗。

本機器人專案利用 **Node.js v18.17.0** 或更高版本、**Discord.js v14** 以及 **DisTube v5**，能夠從多種主流平台（如 YouTube, SoundCloud, Spotify, Deezer, Apple Music）以及超過 700 個額外網站無縫播放音樂。

**我專注於優化使用者互動、新增歌詞顯示功能，以及為核心功能添加更直觀的控制按鈕，讓音樂體驗更加豐富便捷。**

我們相信，無論是舉辦線上派對，或是與朋友輕鬆聚會，我們的機器人都能確保你喜愛的音樂觸手可及。

## 🔥 主要特色 (來自基於專案並可自行修改)

* **無需 API Key：** 簡潔的設置，無需額外申請各種 API 金鑰。
* **多平台支援：** 支援 YouTube, SoundCloud, Spotify, Apple Music, Deezer 等，以及超過 700 個其他網站的音樂串流。
* **播放列表支援：** 可播放支援來源的完整播放列表 URL。
* **Discord URL 播放：** 直接從 Discord 連結播放音樂。
* **使用者友善：** 專為易用性設計，讓所有使用者都能輕鬆上手。
* **自動播放：** 根據你的聆聽偏好自動連續播放歌曲。
* **音訊濾鏡：** 應用多種音訊濾鏡，提升聽覺體驗。
* **歌曲導航：** 輕鬆快進或快退曲目。
* **佇列管理：** 創建和管理歌曲佇列，實現不間斷播放。
* **隨機播放：** 享受隨機播放的體驗。

**✨ 我的額外拓展功能：**
* **增強的「正在播放」顯示：**
    * **歌詞顯示：** 整合第三方 API (例如 Genius API)，直接在訊息中顯示當前播放歌曲的歌詞。若歌詞內容過長，將自動截斷並提供一個可點擊的連結，引導使用者前往完整歌詞頁面。

## 🚧 環境要求

* **Discord Bot Token:** 請參考 [Discord 官方指南](https://discord.com/developers/docs/getting-started/bot-authorization) 獲取你的機器人 Token。
    * **重要：** 務必在 Discord Developer Portal 中為你的機器人啟用 **"Message Content Intent"**。
    * **重要：** 為了確保斜線指令正常運作，在邀請機器人至伺服器時，請務必在 OAuth2 URL Generator 勾選 **`applications.commands`** 權限。
* **Node.js v18.17.0 或更高版本**

**注意：** 你不需要任何額外的 API 金鑰來設置此機器人！你只需要 Node.js 和 Discord 機器人 Token。

## 🚀 快速開始

1.  **複製專案:**
    ```bash
    git clone [https://github.com/](https://github.com/)[你的GitHub使用者名稱]/[你的專案名稱].git
    cd [你的專案名稱]
    ```
    *（如果你直接從 iTzArshia 的專案複製，請使用他們的連結，然後你再自行改為你的 repository）*

2.  **設定 `config.json`:**
    打開專案根目錄下的 `config.json` 檔案，並填入以下資訊：
    ```json
    {
        "Prefix": "!", // 你希望的指令前綴，例如 "!" 或 "."
        "MainColor": "#0099ff", // 嵌入式訊息的主要顏色 (Hex Code)
        "ErrorColor": "#ff0000", // 錯誤訊息的顏色 (Hex Code)
        "ClientID": "YOUR_BOT_CLIENT_ID_HERE", // 你的機器人應用程式 ID
        "Token": "YOUR_BOT_TOKEN_HERE", // 你的機器人 Token
        "GeniusAccessToken": "YOUR_GENIUS_ACCESS_TOKEN_HERE" // 從 Genius 開發者網站獲取的 Access Token

    }
    ```
    **⚠️ 注意：絕不要公開你的 Token 或將其提交到公開的程式碼庫中！⚠️**

3.  **安裝依賴套件:**
    開啟終端機，在專案根目錄下執行：
    ```bash
    npm install
    ```

4.  **部署斜線指令:**
    安裝完成後，運行以下指令來部署斜線指令到 Discord：
    ```bash
    node register.js
    ```

5.  **啟動機器人:**
    最後，在終端機中運行以下指令來啟動機器人：
    ```bash
    node index.js
    ```

---

**基於 [iTzArshia/Discord-Music-Bot](https://github.com/iTzArshia/Discord-Music-Bot)**

