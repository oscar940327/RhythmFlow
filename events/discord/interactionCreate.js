const Discord = require("discord.js");
const config = require("../../config.json");
const func = require("../../utils/functions");
// const { Client } = require("genius-lyrics"); // 由於不再處理歌詞按鈕，如果沒有其他地方需要，可以移除此行
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = async (client, interaction) => {
    // 處理斜線指令 (Chat Input Commands)
    if (interaction.isChatInputCommand()) {
        // 檢查機器人是否有足夠的權限在當前頻道發送訊息和嵌入式連結
        if (
            !interaction.channel.permissionsFor(interaction.guild.members.me).has(["ViewChannel", "SendMessages", "EmbedLinks", "ReadMessageHistory"])
        )
            return;

        const command = client.SlashCommands.get(interaction.commandName);
        if (command) {
            const memberVC = interaction.member.voice.channel || null; // 使用者所在的語音頻道
            const botVC = interaction.guild.members.me.voice.channel || null; // 機器人所在的語音頻道
            const queue = client.distube.getQueue(interaction.guild) || null; // 獲取當前佇列

            // 檢查命令所需的語音頻道狀態
            if (command.memberVoice) {
                if (!memberVC) return interaction.reply({ content: "⚠️ 您必須連接到一個語音頻道。", ephemeral: true });
            }

            if (command.botVoice) {
                if (!botVC) return interaction.reply({ content: "⚠️ 我沒有連接到任何語音頻道。", ephemeral: true });
            }

            if (command.sameVoice) {
                if (memberVC && botVC && memberVC.id !== botVC.id)
                    return interaction.reply({ content: "⚠️ 您沒有連接到我所在的語音頻道。", ephemeral: true });
            }

            if (command.queueNeeded) {
                if (!queue) return interaction.reply({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
            }

            // 執行命令
            try {
                command.execute(client, interaction, memberVC, botVC, queue);
            } catch (error) {
                // 處理命令執行時的錯誤
                console.error(`[斜線指令錯誤] 命令 ${interaction.commandName} 執行時發生錯誤:`, error);
                return interaction
                    .reply({ content: error.message.length > 4096 ? error.message.slice(0, 4093) + "..." : error.message, ephemeral: true })
                    .catch(() => null); // 防止再次報錯
            }
        }
    } 
    // 處理按鈕互動或字串選擇菜單互動
    else if (interaction.isButton() || interaction.isStringSelectMenu()) {
        // 獲取語音頻道資訊和佇列
        const memberVC = interaction.member.voice.channel || null;
        const botVC = interaction.guild.members.me.voice.channel || null;
        const queue = client.distube.getQueue(interaction.guild) || null; // 將 queue 提到這裡，以便所有按鈕邏輯都能訪問

        // 預先檢查語音頻道和佇列狀態，適用於大多數音樂控制按鈕
        if (!memberVC) return interaction.reply({ content: "⚠️ 您必須連接到一個語音頻道。", ephemeral: true });
        if (!botVC) return interaction.reply({ content: "⚠️ 我沒有連接到任何語音頻道。", ephemeral: true });
        if (memberVC && botVC && memberVC.id !== botVC.id)
            return interaction.reply({ content: "⚠️ 您沒有連接到我所在的語音頻道。", ephemeral: true });
        
        // **修改：** 由於不再有 "show_lyrics" 按鈕，移除此條件判斷，恢復為所有按鈕都 deferUpdate
        await interaction.deferUpdate(); 
        
        try {
            // 根據 customId 執行對應的操作
            if (interaction.customId === "filters") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                if (interaction.isStringSelectMenu()) { // 確保是 StringSelectMenu
                    if (queue.filters.has(interaction.values[0])) {
                        await queue.filters.remove(interaction.values[0]);
                    } else {
                        await queue.filters.add(interaction.values[0]);
                    }

                    const filtersEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setTitle("🎧 濾鏡")
                        .setDescription(`**當前佇列濾鏡:** \`${queue.filters.names.join(", ") || "關閉"}\`\n\n${func.queueStatus(queue)}`)
                        .setFooter({
                            text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                        });

                    await interaction.editReply({ embeds: [filtersEmbed] });
                }
            } else if (interaction.customId === "loop") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                const currentLoopState = queue.repeatMode;
                const nextLoopMode = [0, 1, 2][(currentLoopState + 1) % 3];
                let mode = await queue.setRepeatMode(nextLoopMode);
                mode = mode ? (mode === 2 ? "整個佇列" : "當前歌曲") : "關閉";

                const loopEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle("🔁 循環")
                    .setDescription(`循環模式已更改為 \`${mode}\`\n\n${func.queueStatus(queue)}`)
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [loopEmbed] });
            } else if (interaction.customId === "previous") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                if (queue.previousSongs.length > 0) {
                    await queue.previous();
                    const skippedEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setTitle("🔙 上一首")
                        .setDescription("正在跳轉到上一首歌曲。")
                        .setFooter({
                            text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                        });
                    await interaction.editReply({ embeds: [skippedEmbed] });
                } else {
                    await interaction.followUp({ content: "⚠️ 沒有上一首歌曲了。", ephemeral: true });
                }
            } else if (interaction.customId === "pauseUnpause") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                if (queue.paused) {
                    await queue.resume();
                } else {
                    await queue.pause();
                }

                const pauseUnpauseEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle(queue.paused ? "⏸️ 暫停" : "▶️ 恢復")
                    .setDescription(`${queue.paused ? "已暫停" : "已恢復"} 歌曲播放。`)
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [pauseUnpauseEmbed] });
            } else if (interaction.customId === "next") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                if (queue.songs.length > 1) {
                    await queue.skip();

                    const skippedEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setTitle("⏭️ 跳過")
                        .setDescription("正在跳轉到下一首歌曲。")
                        .setFooter({
                            text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                        });

                    await interaction.editReply({ embeds: [skippedEmbed] });
                } else {
                    await interaction.followUp({ content: "⚠️ 佇列中沒有下一首歌曲了。", ephemeral: true });
                }
            } else if (interaction.customId === "shuffle") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                await queue.shuffle();

                const shuffleEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle("🔀 隨機播放")
                    .setDescription("已打亂佇列中的歌曲順序。")
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [shuffleEmbed] });
            } else if (interaction.customId.startsWith("vol")) {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                const volumeUpDown = interaction.customId.split("-")[1];

                if (volumeUpDown === "up") {
                    if (queue.volume === 200) {
                        const volumeEmbed = new Discord.EmbedBuilder()
                            .setColor(config.WarnColor)
                            .setTitle("⚠️ 警告")
                            .setDescription("音量不能高於 `200`。")
                            .setFooter({
                                text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                                iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                            });

                        return interaction.editReply({ embeds: [volumeEmbed] });
                    }
                    await queue.setVolume(queue.volume + 10);
                } else if (volumeUpDown === "down") {
                    if (queue.volume === 0) {
                        const volumeEmbed = new Discord.EmbedBuilder()
                            .setColor(config.WarnColor)
                            .setTitle("⚠️ 警告")
                            .setDescription("音量不能低於 `0`。")
                            .setFooter({
                                text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                                iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                            });

                        return interaction.editReply({ embeds: [volumeEmbed] });
                    }
                    await queue.setVolume(queue.volume - 10);
                }

                const volumeEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle("🔊 音量")
                    .setDescription(`音量已更改為 \`${queue.volume}\`\n\n${func.queueStatus(queue)}`)
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [volumeEmbed] });
            } else if (interaction.customId === "backward") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                await queue.seek(queue.currentTime - 10);

                const seekEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle("⏪ 後退")
                    .setDescription(`已將歌曲後退 10 秒。`)
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [seekEmbed] });
            } else if (interaction.customId === "stop") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                await queue.stop();
                if (client.distubeSettings.leaveOnStop) await queue.voice.leave();

                const stopEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle("🚫 停止")
                    .setDescription("已停止播放。")
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [stopEmbed] });
            } else if (interaction.customId === "forward") {
                if (!queue) return interaction.followUp({ content: "⚠️ 我現在沒有播放任何東西。", ephemeral: true });
                await queue.seek(queue.currentTime + 10);

                const seekEmbed = new Discord.EmbedBuilder()
                    .setColor(config.MainColor)
                    .setTitle("⏩ 前進")
                    .setDescription(`已將歌曲前進 10 秒。`)
                    .setFooter({
                        text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                    });

                await interaction.editReply({ embeds: [seekEmbed] });
            }
        } catch (error) {
            console.error("處理按鈕互動時發生錯誤:", error);
            const errorEmbed = new Discord.EmbedBuilder()
                .setColor(config.ErrorColor)
                .setTitle("❌ 錯誤")
                .setDescription(error.message.length > 4096 ? error.message.slice(0, 4093) + "..." : error.message)
                .setFooter({
                    text: `請求者: ${interaction.user.globalName || interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
                });

            return interaction.editReply({ embeds: [errorEmbed] });
        }
    } 
    // **重要修改：** 移除整個處理 "show_lyrics" 按鈕的 else if 區塊
    // else if (interaction.isButton() && interaction.customId === "show_lyrics") { /* ... (此區塊已移除) ... */ }
};