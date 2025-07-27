const Discord = require("discord.js");
const config = require("../../config.json");

module.exports = {
    name: "Backward",
    aliases: ["BW", "Rewind"],
    description: "Backwards the playing song.",
    usage: "Backward <Seconds>",
    category: "Song Commands",
    memberVoice: true,
    botVoice: true,
    sameVoice: true,
    queueNeeded: true,

    async execute(client, message, args, cmd, memberVC, botVC, queue) {
        const time = Number(args[0]);

        if (!args[0] || isNaN(time)) {
            const noArgsEmbed = new Discord.EmbedBuilder()
                .setColor(config.WarnColor)
                .setTitle("⚠️ Warn")
                .setDescription("Please provide time (in seconds) to go backward!\n**Example:** `10` for 10 seconds backward.")
                .setFooter({
                    text: `Requested by ${message.author.globalName || message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ size: 1024 }),
                });

            return message.reply({ embeds: [noArgsEmbed] });
        }

        try {
            await queue.seek(queue.currentTime - time);

            const seekEmbed = new Discord.EmbedBuilder()
                .setColor(config.MainColor)
                .setTitle("⏪ Backward")
                .setDescription(`Backwarded the song for ${time} seconds.`)
                .setFooter({
                    text: `Requested by ${message.author.globalName || message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ size: 1024 }),
                });

            await message.reply({ embeds: [seekEmbed] });
        } catch (error) {
            const errorEmbed = new Discord.EmbedBuilder()
                .setColor(config.ErrorColor)
                .setTitle("❌ Error")
                .setDescription(error.message.length > 4096 ? error.message.slice(0, 4093) + "..." : error.message)
                .setFooter({
                    text: `Requested by ${message.author.globalName || message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ size: 1024 }),
                });

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};
