const Discord = require("discord.js");
const func = require("../../utils/functions");
const config = require("../../config.json");
const { Client } = require("genius-lyrics"); // 導入 genius-lyrics 客戶端
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js'); 

module.exports = {
    data: new Discord.SlashCommandBuilder().setName("nowplaying").setDescription("Shows the current playing song."),
    memberVoice: true,
    botVoice: true,
    sameVoice: true,
    queueNeeded: true,

    async execute(client, interaction, memberVC, botVC, queue) {
        // 延遲回覆，讓機器人顯示「正在思考...」
        await interaction.deferReply({ ephemeral: false });

        const voiceChannelMembers = botVC.members.filter((member) => !member.user.bot);
        const song = queue.songs[0];

        let lyrics = '正在查詢歌詞...';
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
            console.error('查詢歌詞時發生錯誤:', error);
            if (error && error.code === 'InvalidGeniusKey') {
                lyrics = 'Genius API 金鑰無效，請檢查你的 Genius Access Token。';
            } else {
                lyrics = '獲取歌詞時發生錯誤，請稍後再試。';
            }
        }
        // --- 歌詞查詢邏輯結束 ---

        // --- 構建 Embed 訊息 ---
        const nowEmbed = new Discord.EmbedBuilder()
            .setColor(config.MainColor)
            .setTitle("💿 Now Playing")
            .setDescription(
                `正在播放 **[${song.name} (${song.formattedDuration})](${song.url})** 給 ${
                    voiceChannelMembers.size 
                } 位聽眾在 ${botVC} 頻道中。\n\n${func.queueStatus(queue)}`
            )
            .setThumbnail(song?.thumbnail)
            .setFooter({
                text: `歌曲請求者: ${song.user.globalName || song.user.username}`,
                iconURL: song.user.displayAvatarURL({ size: 1024 }),
            });

        // 添加歌曲的詳細資訊字段
        if (song.views)
            nowEmbed.addFields({
                name: "👀 觀看次數:",
                value: `${func.numberWithCommas(song.views)}`,
                inline: true,
            });

        if (song.likes)
            nowEmbed.addFields({
                name: "👍🏻 喜歡:",
                value: `${func.numberWithCommas(song.likes)}`,
                inline: true,
            });

        if (song.dislikes)
            nowEmbed.addFields({
                name: "👎🏻 不喜歡:",
                value: `${func.numberWithCommas(song.dislikes)}`,
                inline: true,
            });
        
        if (song.uploader?.name) nowEmbed.addFields({ name: '👤 藝術家', value: song.uploader.name, inline: true });
        if (song.uploadedAt) nowEmbed.addFields({ name: '📅 發布日期', value: song.uploadedAt, inline: true });

        // 添加歌詞字段
        nowEmbed.addFields({
            name: '📝 歌詞',
            value: `\`\`\`\n${lyrics}\n\`\`\``
        });

        // 如果存在 Genius 連結，添加一個單獨的連結字段
        if (geniusSongUrl) {
            nowEmbed.addFields({
                name: '🔗 完整歌詞連結',
                value: `[點擊這裡查看完整歌詞](${geniusSongUrl})`,
                inline: false
            });
        }

        // --- 構建控制按鈕 (與 playSong.js 中的按鈕結構一致) ---
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

        // 發送最終的 Embed 訊息，並包含所有按鈕行
        await interaction.editReply({ embeds: [nowEmbed], components: [row1, row2, row3] }); // 這裡移除了 row4
    },
};