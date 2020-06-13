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

    // if the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {

        // get the part after the prefix
        let text: string | undefined = message.content.match(/(?<=roll\s).*/i)?.toString()
        let joiner: string = ""
        let diceReducer: ((output: string, current: number[]) => string) | null = null
        let format: ((rolls: number[][], modifier: Modifier | null) => string) | null = null

        // if is valid input (with or without a mode), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d[4,6,8,10,12,20])+(\s(\+\-)[0-9]+)?/i.test(message.content)) {
            enum Command {
                Sum = "SUM",
                Advantage = "ADV",
                Disadvantage = "DISADV",
                List = "LIST"
            }

            // get the mode
            let command: Command | string | undefined = text.match(/^[a-z]+/i)?.toString()
            if (command && /^(sum|add|total)$/i.test(command))
                command = Command.Sum
            else if (command && /^(adv(antage)?).*/i.test(command))
                command = Command.Advantage
            else if (command && /^(disadv(antage)?).*/i.test(command))
                command = Command.Disadvantage
            else if (command === undefined)
                command = Command.List
            console.log("mode", command)

            // mode is sum/add/total
            if (command === Command.Sum) {
                // diceReducer = (output: string, current: number[]): string => `${output} + [${current}]`
                joiner = " + "
                format = (rolls: number[][], modifier: Modifier | null): string => {
                    let total: number = modifier ? parseInt(modifier.value) : 0
                    rolls.forEach(roll => total += roll[0])
                    return `**${total}**`
                }
            }

            // mode is adv/disadv
            else if (command === Command.Advantage || command === Command.Disadvantage) {
                // diceReducer = (output: string, current: number[]): string => `${output} or [${current}]`
                joiner = " or "
                format = (rolls: number[][], modifier: Modifier | null): string => {
                    let output: string[] = []
                    for (const roll of rolls)
                        if (command !== undefined && /^(adv(antage)?).*/i.test(command))
                            output.push(`[${roll.reduce((max, curr) => Math.max(max, curr), -Infinity) + (modifier ? parseInt(modifier.value) : 0)}]`)
                        else if (command !== undefined && /^(disadv(antage)?).*/i.test(command))
                            output.push(`[${roll.reduce((min, curr) => Math.min(min, curr), Infinity) + (modifier ? parseInt(modifier.value) : 0)}]`)
                    return `**${output.join(", ")}**`
                }
            }

            // mode is undefined (implicitly, it is list)
            else if (command === Command.List) {
                // diceReducer = (output: string, current: number[]): string => `${output}, [${current}]`
                joiner = ", "
                format = (rolls: number[][], modifier: Modifier | null): string => {
                    let output: string[][] = []
                    for (const roll of rolls)
                        output.push(roll.map(number => `[${number + (modifier ? parseInt(modifier.value) : 0)}]`))
                    return `**${output.join(", ")}**`
                }
            }

            // if unknown mode is specified, reply with error
            else {
                message.reply(`Error: ${command} is not a valid mode`)
                return
            }

            // get each die or number individually -> inputs: string[]
            let inputs: string[] = text.split(" ").map(word => word.replace(",", "").trim())
            let output: { dice: number[][], modifier: string } = { dice: [], modifier: "" }
            let rolls: Dice[][] = []
            let modifier: Modifier | null = null

            // inputs: string[] -> rolls: Dice[][]
            inputs.forEach(input => {

                // input is Dice
                if (/[0-9]+d[4,6,8,10,12,20]/i.test(input)) {
                    let quantity: string | undefined = input.match(/^[0-9]+/)?.toString()
                    let type: string | undefined = input.match(/[0-9]+$/)?.toString()

                    // add quantity d type dice to be rolled
                    if (quantity != undefined && type != undefined)
                        for (let i = 0; i < parseInt(quantity); i++) {

                            // if mode is adv/advantage or disadv/disadvantage, roll twice
                            if (command !== undefined && /^((adv|disadv)(antage)?).*/i.test(command))
                                rolls.push([new Dice(parseInt(type)), new Dice(parseInt(type))])

                            // else roll once
                            else
                                rolls.push([new Dice(parseInt(type))])
                        }
                }

                // input is Modifier
                else if (/^(\+|\-)[0-9]+/.test(input)) {
                    let regex: RegExpMatchArray | null = input.match(/(?<=(\+|\-))[0-9]+/)
                    if (regex !== null) {
                        let sign: string = regex[1]
                        let value: number = parseInt(regex[0])
                        if (modifier)
                            modifier = new Modifier((sign === "-" ? -1 : 1) * value + parseInt(modifier.value))
                        else
                            modifier = new Modifier((sign === "-" ? -1 : 1) * value)
                        output.modifier = modifier.value
                    }
                }
            })

            // rolls: Dice[][] -> output: number[][]
            output.dice = rolls.map(roll => roll.map(die => die.evaluate()))
            let reply: string | string[][] = []
            for (const roll of output.dice)
                reply.push(roll.map(number => `[${number + (modifier ? parseInt(modifier.value) : 0)}]`))
            reply = `${reply.join(joiner)}`

            if (format)
                reply += ` = ${format(output.dice, modifier)}`
            message.reply(reply)
            if (format !== null && modifier !== undefined) {
                console.log(format(output.dice, modifier))
            }

        } else {
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
    public value: string

    constructor(value: number) {
        if (value > 0)
            this.value = `+${value}`
        else
            this.value = `${value}`
    }
}