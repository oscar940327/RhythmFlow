const Discord = require("discord.js");
const config = require("../../config.json");

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays song for you.")
        .addStringOption((option) => option.setName("query").setDescription("Enter song name or playlist list.").setRequired(true)),
    memberVoice: true,
    botVoice: false, // 設置為 false，因為機器人可能還不在頻道中，play 指令會讓它加入
    sameVoice: true, // 仍然檢查使用者是否在同一個頻道 (如果機器人已經在的話)
    queueNeeded: false, // play 指令不需要佇列存在

    async execute(client, interaction, memberVC, botVC, queue) {
        // 先回覆一個臨時訊息，表示正在處理
        await interaction.deferReply({ ephemeral: false }); // ephemeral: false 表示訊息公開可見

        const query = interaction.options.getString("query");

        const searchEmbed = new Discord.EmbedBuilder()
            .setColor(config.MainColor)
            .setDescription("🎵 正在搜尋並準備播放歌曲...") // 更新描述
            .setFooter({
                text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
            });

        await interaction.editReply({ embeds: [searchEmbed] }); // 顯示「搜尋中」或「準備播放」訊息

        try {
            // 調用 distube.play 來開始播放。
            // 實際的播放面板將由 'playSong' 事件發送，所以這裡的回覆是短暫的。
            await client.distube.play(memberVC, query, {
                member: interaction.member,
                textChannel: interaction.channel,
                // interaction: interaction, // 可以傳遞 interaction，但我們主要依賴 playSong 事件處理
            });

            // 編輯原始回覆為一個簡潔的確認訊息
            await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`✅ 已將 **${query}** 加入佇列！\n*稍後將顯示播放控制面板。*`)
                        .setFooter({
                            text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                        })
                ]
            });

        } catch (error) {
            const errorEmbed = new Discord.EmbedBuilder()
                .setColor(config.ErrorColor)
                .setTitle("❌ 錯誤")
                .setDescription(`播放時發生錯誤: ${error.message.length > 4096 ? error.message.slice(0, 4093) + "..." : error.message}`)
                .setFooter({
                    text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};