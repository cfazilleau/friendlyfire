const Discord = require('discord.js');
const mongoose = require('mongoose');
const moment = require('moment');

const MONGODB_URI = 'mongodb+srv://bot:clefaz@friendlyfire.mqhih.gcp.mongodb.net/';

mongoose.Promise = global.Promise;

mongoose.connect(MONGODB_URI, { dbName: 'codabot', useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
	if (err)
		console.log('failed connecting to quote database: ' + err);
	else
		console.log('connected to quote database');
});

QuoteSchema = new mongoose.Schema({
	author: String,
	submitted_by: String,
	quote: String,
	time: String
});
mongoose.model('quotes', QuoteSchema);

exports.events = [
	'message'
]

exports.commands = [
	'quote'
]

exports.message = {
	process: function (message) {
		if (message.channel.name != 'quote' ||
			!message.content.startsWith('\"'))
			return;

		var embed = new Discord.RichEmbed();
		var quote = message.content.split('\"');
		if (quote.length !== 3) {
			embed.setAuthor('Erreur de syntaxe !', 'http://i.imgur.com/BCLvfAM.png');
			embed.setColor('#ffe86c');
			embed.setDescription('\" Quote a citer \" --Auteur');
			embed.setFooter('noticed by ' + message.author.username, message.author.avatarURL);
			message.channel.sendEmbed(embed);
			return;
		}
		if (mongoose.connection.readyState === 0) {
			embed.setAuthor('Erreur de sauvegarde !', 'http://i.imgur.com/jkdLeKt.png');
			embed.setColor('#ff522c');
			embed.setDescription('Problème de Database \n-> go appeler Coda');
			embed.setFooter('noticed by ' + message.author.username, message.author.avatarURL);
			message.channel.sendEmbed(embed);
			return;
		}

		var auteur = quote[2].split('-');
		mongoose.models.quotes.countDocuments({}, function (err, result) {
			if (!err) {
				var tmp = new mongoose.models.quotes();
				tmp.author = auteur[auteur.length - 1];//
				tmp.submitted_by = message.author.username;
				tmp.quote = quote[1];
				tmp.time = moment.utc(message.createdAt).add(1, 'hour').format('DD/MM/YY HH:mm');
				tmp.save(function (err) {
					if (err) {
						console.log('\033[31m[QUOTE] error saving quote\033[0m');
						embed.setColor('#ff522c');
						embed.setAuthor('Erreur de sauvegarde !', 'http://i.imgur.com/jkdLeKt.png');
						embed.setDescription('Problème de tmp.save \n-> go appeler Coda');
						embed.setFooter('noticed by ' + message.author.username, message.author.avatarURL);
						message.channel.sendEmbed(embed);
					}
					else {
						console.log('\033[32m[QUOTE] citation enregistrée: #' + result + '\033[0m');
						embed.setFooter('Saved by ' + tmp.submitted_by + ' -- Quote n°' + (result + 1) + ' -- ' + tmp.time, message.author.avatarURL);
						embed.setAuthor(tmp.author, 'http://i.imgur.com/EeC5BAb.png');
						embed.setColor('#2ea42a');
						embed.setDescription(tmp.quote);
						message.channel.fetchMessages({ limit: 50 }).then(function (messages) {
							message.channel.send(embed).then(msg => {
								messages.forEach(function (mssg) {
									if (mssg.author.id === msg.author.id) {
										mssg.delete();
									}
								});
							});
						});

					}
				});
			}
		});
	}
}

exports.quote = {
	usage: '',
	description: 'get a random quote from the database',
	process: function (bot, msg, suffix) {
		mongoose.models.quotes.countDocuments().exec(function (err, count) {
		if (!err)
		{
			var random = Math.floor(Math.random() * count);
			mongoose.models.quotes.findOne().skip(random).exec(
				function (err, result) {
					var embed = new Discord.RichEmbed();
					embed.setColor('#30c8fc');
					embed.setDescription('"' + result.quote + '"');
					embed.setFooter(result.author);
					msg.channel.send(embed);
				});
			}
		});

		return msg.delete();
	}
}