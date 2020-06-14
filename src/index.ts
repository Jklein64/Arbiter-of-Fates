require("dotenv").config()
import { Client, Message } from "discord.js"
const client = new Client()


client.on("ready", () => {
    console.log(`logged in as ${client.user?.tag}!`)
})


client.on("message", (message: Message) => {

    // dont' do anything in response to own messages
    if (message.author.username === "Arbiter of Fates")
        return

    // the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {

        // get the part after the prefix
        let text: string | undefined = message.content.match(/(?<=roll\s).*/i)?.toString()

        // is valid input (with or without a Command), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d(4|6|8|10|12|20))+(\s(\+\-)[0-9]+)?/i.test(message.content)) {
            enum Command {
                Sum = "SUM",
                Advantage = "ADV",
                Disadvantage = "DISADV",
                List = "LIST"
            }

            // get the command type
            let command: Command | string | undefined = text.match(/^[a-z]+/i)?.toString()

            // command is Sum
            if (command && /^(sum|add|total)$/i.test(command))
                command = Command.Sum

            // command is Advantage
            else if (command && /^(adv(antage)?).*/i.test(command))
                command = Command.Advantage

            // command is Disadvantage
            else if (command && /^(disadv(antage)?).*/i.test(command))
                command = Command.Disadvantage

            // command is List
            else if (command === undefined)
                command = Command.List

            else {
                message.reply(`Hey dumbass, ${command} doesn't exist! Just like ur brain cells xD`)
                return
            }

            // get each die or number individually -> inputs: string[]
            let inputs: RegExpMatchArray | null = text.match(/([0-9]+d(4|6|8|10|12|20))|((\+|\-)\s?[0-9]+)/gi)
            let modifier: Modifier = new Modifier(0)
            let rolls: Dice[][] = []

            // inputs are valid
            if (inputs)

                // inputs: string[] -> rolls: Dice[][]
                inputs.forEach(input => {

                    // input is Dice
                    if (/[0-9]+d(4|6|8|10|12|20)/gi.test(input)) {
                        let quantity: string | undefined = input.match(/^[0-9]+/)?.toString()
                        let type: string | undefined = input.match(/(4|6|8|10|12|20)$/)?.toString()
                        let dice: Dice[]

                        // add quantity d type dice to be rolled
                        if (quantity && type) {
                            dice = Array<Dice>(parseInt(quantity))
                            if (command === Command.Advantage || command === Command.Disadvantage)
                                rolls.push(dice.fill(new Dice(parseInt(type))))
                            rolls.push(dice.fill(new Dice(parseInt(type))))
                        }
                    }

                    // input is Modifier
                    else if (/^(\+|\-)\s?[0-9]+/g.test(input)) {
                        let regex: RegExpMatchArray | null = input.match(/(\+|\-)|[0-9]+/g)
                        if (regex) {
                            let sign: number = parseInt(`${regex[0]}1`)
                            let value: number = parseInt(regex[1])
                            let prev: number = modifier.value

                            // make Modifier or add on to previous
                            modifier = new Modifier(sign * value + prev)
                        }
                    }
                })

            // inputs are invalid
            else {
                message.reply("Hey, no fair.  That wasn't a die, command, or modifier")
                return
            }


            let expression: string | string[] = []
            let evaluation: string | string[] = []

            // turn dice into expression and evaluation
            for (let roll of rolls) {
                let output: number[] = roll.map(dice => dice.evaluate())

                // command is Advantage or Disadvantage
                if (command === Command.Advantage || command === Command.Disadvantage) {
                    expression.push(`[${output.join(" or ")}]`)

                    // command is Advantage
                    if (command === Command.Advantage) {
                        let max: number = output.reduce((max, curr) => Math.max(max, curr), -Infinity)
                        evaluation.push(`${max + modifier.value}`)
                    }

                    // command is Disadvantage
                    else if (command === Command.Disadvantage) {
                        let min: number = output.reduce((min, curr) => Math.min(min, curr), Infinity)
                        evaluation.push(`${min + modifier.value}`)
                    }
                }

                // command is Sum/Add/Total
                else if (command === Command.Sum) {
                    expression.push(`[${output.join(" + ")}]`)
                    let prev: number = evaluation[0] ? parseInt(evaluation[0]) : modifier.value
                    evaluation[0] = `${prev + output.reduce((total, curr) => total += curr)}`
                }

                // command is List
                else if (command === Command.List) {
                    expression.push(`[${output.join(", ")}]`)
                    evaluation.push(`${output.map(num => num + modifier.value).join(", ")}`)
                }
            }

            // format expression and evaluation
            expression = expression.join(", ")
            evaluation = evaluation.join(", ")

            // reply to the message
            message.reply(`${expression} = **${evaluation}**`)
        }

        // invalid input
        else {
            message.reply("That isn't a valid input ya doof")
            return
        }
    }
})


client.login(process.env.TOKEN)


class Dice {
    private type: number

    constructor(type: number) {
        this.type = type
    }

    evaluate(): number {
        let num: number = Math.random()
        for (let roll = 1; roll <= this.type; roll++)
            if (num < (roll / this.type))
                return roll
        return this.type
    }
}


class Modifier {
    public value: number

    constructor(value: number) {
        this.value = value
    }

    toString(): string {
        if (this.value > 0)
            return `+${this.value}`
        else
            return `${this.value}`
    }
}