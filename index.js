require('dotenv').config()
const Discord = require("discord.js")
const client = new Discord.Client()


client.on("ready", () => console.log(`logged in as ${client.user.tag}!`))

client.on("message", message => {
  let text = message.content
  regex = new RegExp(`^${process.env.PREFIX}\\s.*`, "i") // starts with "roll " and is followed by something
  if (regex.test(text)) {
    regex = new RegExp(`^${process.env.PREFIX}\\s`, "i") // the "roll " part of the message
    let command = text.replace(regex, "").trim()
    if (/help/i.test(command)) // contains the word "help", case insensitive
      handleHelp(message)
    else
      handleRoll(message, command)
  }
})

client.login(process.env.SECRET_KEY) // pls don't share this String


function handleRoll(message, commands) {
  let advantage = disadvantage = false
  if (/disadv|disadvantage/i.test(commands)) {
    commands = commands.replace(/disadv|disadvantage/i, "")
    disadvantage = true
  } else if (/adv|advantage/i.test(commands)) {
    commands = commands.replace(/adv|advantage/i, "")
    advantage = true
  }

  commands = commands.split("+").map(str => str.trim())
  let reply = crit = ""
  let total = 0

  commands.forEach(command => {
    if (/d/i.test(command)) { // if command has a d, case insensitive
      let die = new Die(command)
      reply += `[${die.roll(advantage, disadvantage)}] + `
      total += parseInt(die.total)
      crit = die.crit
    } else {
      reply += `[${command}] + `
      total += parseInt(command)
    }
  })

  reply = reply.replace(/(\+ )$/, "").trim()
  message.reply(`${reply} = **${total}**`)
    .catch(error => {
      console.log(error)
      message.reply(`there were too many numbers for my pitiful grey matter to handle.  Here's your total though: **${total}**`)
    })
  if (crit === "success")
    message.reply(makeBigLetters("CRITICAL"))
  else if (crit === "fail")
    message.reply(makeBigLetters("WAISTED"))
  // if (message.author.username === "UrsusMaiorus")
  // message.channel.send("gottem")
}

function handleHelp(message) {
  let reply = "type `roll` and the die/dice you would like to roll, along with any modifiers, like this: ```roll 2d4 + 3d8 + 5```  Type adv (or advantage) to roll with advantage and disadv (or disadvantage) to roll with disadvantage, like this: ```roll 1d20 + 5 adv```"
  message.reply(reply)
}

function makeBigLetters(string) {
  chars = string.toLowerCase().split("") // separate into array of chars
  chars = chars.map(char => `:regional_indicator_${char}:`) // turn each char into respective regional_indicator
  return chars.reduce((string, char) => `${string} ${char}`) // put chars back together
}

class Die {
  constructor(string) {
    this.quantity = parseInt(string.match(/^[0-9]*/)) // every consecutive number from the beginning
    this.type = parseInt(string.match(/[0-9]*$/)) // every consecutive number from the end
    this.crit = ""
  }

  roll(advantage, disadvantage) {
    const Random = require("random-js").Random;
    const random = new Random();
    let numRolls = advantage ^ disadvantage ? this.quantity * 2 : this.quantity; // XOR since adv and disadv cancel
    let totalReducer = (total, current) => total + current // sum all rolls
    let rollReducer = (string, value) => string += `${value} + ` // format rolls to look like sum
    let outputs = []

    if (advantage ^ disadvantage) {
      rollReducer = (string, value) => string += `${value} or ` // format rolls to look like decisions
      if (advantage)
        totalReducer = (max, current) => Math.max(max, current) // finds the max of all rolls
      else if (disadvantage)
        totalReducer = (min, current) => Math.min(min, current) // finds the min of all rolls
    }

    for (let i = 0; i < numRolls; i++) {
      const value = random.integer(1, this.type)
      if (this.type === 20 && value === 1 && !advantage) // only d20's can crit, only applies if no adv (TODO, NOT COMPREHENSIVE)
        this.crit = "fail";
      else if (this.type === 20 && value === 20 && !disadvantage) // only d20's can crit, only applies if no disadv (TODO, NOT COMPREHENSIVE)
        this.crit = "success";
      outputs.push(value)
    }

    let rolls = outputs.reduce(rollReducer, "").trim()
    rolls = rolls.replace(/(\+|or)$/, "").trim()
    this.total = outputs.reduce(totalReducer, 0)
    return `${rolls}`
  }
}