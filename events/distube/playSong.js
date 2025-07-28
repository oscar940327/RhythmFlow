const Discord = require("discord.js");
const func = require("../../utils/functions");
const config = require("../../config.json");
const { Client } = require("genius-lyrics"); // 保留 Client 引入，因為歌詞依然會顯示在 Embed 中
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js'); // <-- 確保這行完整且正確

module.exports = async (client, queue, song) => {
    const voiceChannel = queue.distube.client.channels.cache.get(queue.voice.channelId);
    const voiceChannelMembers = voiceChannel.members.filter((member) => !member.user.bot);

    let lyrics = '正在查詢歌詞...'; // 歌詞的預設值
    const maxLyricsLength = 850; // 設置歌詞最大顯示長度

    // --- 歌詞查詢邏輯開始 ---
    let geniusSongUrl = null; // 初始化 Genius 歌曲連結變數

    try {
        const geniusAccessToken = config.GeniusAccessToken || process.env.GENIUS_ACCESS_TOKEN;
        if (!geniusAccessToken) {
            lyrics = 'Genius API 金鑰未設定。請聯繫機器人擁有者。';
        } else {
            const geniusClient = new Client(geniusAccessToken);

            let artist = song.uploader?.name || song.author || '';
            let title = song.name || '';

            title = title.replace(/(\(|\)|\[|\]|official|music|video|lyrics|feat|ft\.).*?/gi, '').trim();

            const searches = await geniusClient.songs.search(`${artist} - ${title}`);
            let songMatch = null;

            if (searches.length > 0) {
                songMatch = searches.find(s => {
                    const sArtist = typeof s.artist === 'string' ? s.artist.toLowerCase() : '';
                    const sTitle = typeof s.title === 'string' ? s.title.toLowerCase() : '';
                    const cleanArtist = artist.toLowerCase();
                    const cleanTitle = title.toLowerCase();

                    return sArtist.includes(cleanArtist) && sTitle.includes(cleanTitle);
                }) || searches[0];

                if (songMatch) {
                    geniusSongUrl = songMatch.url;
                    const foundLyrics = await songMatch.lyrics();
                    
                    if (foundLyrics) {
                        lyrics = foundLyrics;
                        lyrics = lyrics.replace(/^\s*\d+\s+Contributors?.*?\n/gm, '');
                        lyrics = lyrics.replace(/Translations.*?\n/gm, '');
                        lyrics = lyrics.replace(/^[A-Za-z\s]+ Lyrics\s*\n/gm, '');
                        lyrics = lyrics.replace(/.*?\s*Read More\s*\n/gm, '');
                        lyrics = lyrics.replace(/\[\s*Verse\s*(\d+)\s*\]/gi, '\n[Verse $1]\n');
                        lyrics = lyrics.replace(/\[\s*Pre-Chorus\s*\]/gi, '\n[Pre-Chorus]\n');
                        lyrics = lyrics.replace(/\[\s*Chorus\s*\]/gi, '\n[Chorus]\n');
                        lyrics = lyrics.replace(/\[\s*Bridge\s*\]/gi, '\n[Bridge]\n');
                        lyrics = lyrics.replace(/\[\s*Outro\s*\]/gi, '\n[Outro]\n');
                        lyrics = lyrics.replace(/You might also like[\s\S]*$/gm, '');
                        lyrics = lyrics.replace(/^\s*[\r\n]/gm, '');
                        lyrics = lyrics.trim();

                        if (lyrics.length === 0) {
                            lyrics = '無法獲取清晰的歌詞內容。';
                        } else if (lyrics.length > maxLyricsLength) {
                            lyrics = lyrics.substring(0, maxLyricsLength) + '\n... (歌詞過長)';
                        }
                    } else {
                        lyrics = '找不到這首歌的歌詞。';
                    }
                } else {
                    lyrics = '找不到這首歌的歌詞。';
                }
            } else {
                lyrics = '找不到這首歌的歌詞。';
            }
        }
    } catch (error) {
        console.error('播放歌曲時查詢歌詞發生錯誤:', error);
        if (error && error.code === 'InvalidGeniusKey') {
            lyrics = 'Genius API 金鑰無效，請檢查你的 Genius Access Token。';
        } else {
            lyrics = '獲取歌詞時發生錯誤，請稍後再試。';
        }
    }
    // --- 歌詞查詢邏輯結束 ---

    const embed = new Discord.EmbedBuilder()
        .setColor(config.MainColor)
        .setTitle("💿 Now Playing")
        .setDescription(
            `正在播放 **[${song.name} (${song.formattedDuration})](${song.url})** 給 ${voiceChannelMembers.size} ${
                voiceChannelMembers.size > 1 ? "位聽眾" : "位聽眾"
            } 在 ${voiceChannel} 頻道中。\n\n${func.queueStatus(queue)}`
        )
        .setThumbnail(song?.thumbnail)
        .setFooter({
            text: `請求者: ${song.user.globalName || song.user.username}`,
            iconURL: song.user.displayAvatarURL({ size: 1024 }),
        });

    if (song.views)
        embed.addFields({
            name: "👀 觀看次數:",
            value: `${func.numberWithCommas(song.views)}`,
            inline: true,
        });

    if (song.likes)
        embed.addFields({
            name: "👍🏻 喜歡:",
            value: `${func.numberWithCommas(song.likes)}`,
            inline: true,
        });

    if (song.dislikes)
        embed.addFields({
            name: "👎🏻 不喜歡:",
            value: `${func.numberWithCommas(song.dislikes)}`,
            inline: true,
        });

    if (song.uploader?.name) embed.addFields({ name: '👤 藝術家', value: song.uploader.name, inline: true });
    if (song.uploadedAt) embed.addFields({ name: '📅 發布日期', value: song.uploadedAt, inline: true });

    embed.addFields({
        name: '📝 歌詞',
        value: `\`\`\`\n${lyrics}\n\`\`\``
    });

    if (geniusSongUrl) {
        embed.addFields({
            name: '🔗 完整歌詞連結',
            value: `[點擊這裡查看完整歌詞](${geniusSongUrl})`,
            inline: false
        });
    }

    // --- 構建控制按鈕 ---
    const filters = new StringSelectMenuBuilder().setCustomId("filters").setPlaceholder("選擇濾鏡");
    const options = [];
    for (const filter of Object.keys(queue.distube.filters)) {
        options.push({
            label: filter.charAt(0).toUpperCase() + filter.slice(1),
            value: filter,
        });
    }
    filters.addOptions(options);
    const row1 = new ActionRowBuilder().addComponents([filters]);

    const loopSongToggle = new ButtonBuilder().setCustomId("loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary);
    const previousSong = new ButtonBuilder().setCustomId("previous").setEmoji("⏮️").setStyle(ButtonStyle.Secondary);
    const paunseUnpause = new ButtonBuilder().setCustomId("pauseUnpause").setEmoji("⏯️").setStyle(ButtonStyle.Secondary);
    const nextSong = new ButtonBuilder().setCustomId("next").setEmoji("⏭️").setStyle(ButtonStyle.Secondary);
    const shuffle = new ButtonBuilder().setCustomId("shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary);

    const volumeDown = new ButtonBuilder().setCustomId("vol-down").setEmoji("🔉").setStyle(ButtonStyle.Secondary);
    const backward = new ButtonBuilder().setCustomId("backward").setEmoji("⏪").setStyle(ButtonStyle.Secondary);
    const stop = new ButtonBuilder().setCustomId("stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger);
    const forward = new ButtonBuilder().setCustomId("forward").setEmoji("⏩").setStyle(ButtonStyle.Secondary);
    const volumeUp = new ButtonBuilder().setCustomId("vol-up").setEmoji("🔊").setStyle(ButtonStyle.Secondary);

    const row2 = new ActionRowBuilder().addComponents([loopSongToggle, previousSong, paunseUnpause, nextSong, shuffle]);
    const row3 = new ActionRowBuilder().addComponents([volumeDown, backward, stop, forward, volumeUp]);

    // 這裡移除了 row4 (顯示歌詞按鈕) 的定義

    // 檢查是否有舊的播放訊息需要刪除或編輯
    if (client.PlayingMessageID) {
        try {
            const oldMessage = await queue.textChannel.messages.fetch(client.PlayingMessageID);
            if (oldMessage && oldMessage.editable) { // 如果訊息可編輯
                // 這裡移除了 row4
                await oldMessage.edit({ embeds: [embed], components: [row1, row2, row3] });
                return; // 編輯成功，直接返回
            } else if (oldMessage) { // 如果不可編輯，但仍然存在，則嘗試刪除
                await oldMessage.delete().catch(() => {}); // 靜默處理刪除失敗
            }
        } catch (err) {
            // 舊訊息可能已不存在或無法獲取
            console.log("無法編輯或刪除舊的播放訊息:", err.message);
        }
    }

    // 發送新的播放訊息
    const playingMessage = await queue.textChannel?.send({
        embeds: [embed],
        components: [row1, row2, row3], // 這裡移除了 row4
    });

    // 將新發送的訊息 ID 儲存到 client.PlayingMessageID
    client.PlayingMessageID = playingMessage.id;
};