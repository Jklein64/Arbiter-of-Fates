require("dotenv").config()
import { Client, Message } from "discord.js"
const client = new Client()


client.on("ready", () => {
    console.log(`logged in as ${client.user?.tag}!`)
    // let dice: Dice[] = []
    // let counts: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
    // let count: number = 10000
    // for (let i = 0; i < count; i++)
    //     dice.push(new Dice(8))
    // let output: number[] = dice.map(die => die.run())
    // output.forEach(num => counts[num - 1]++);
    // console.log(counts.map(number => number / count))
})


client.on("message", (message: Message) => {

    // dont' do anything in response to own messages
    if (message.author.username === "Arbiter of Fates")
        return

    // if the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {

        // get the part after the prefix
        let text: string | undefined = message.content.match(/(?<=roll\s).*/i)?.toString()
        let diceReducer: ((output: string, current: number | number[]) => string) | null = null

        // if is valid input (with or without a mode), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d[4,6,8,10,12,20])+(\s(\+\-)[0-9]+)?/i.test(message.content)) {

            // get the mode
            let mode: string | undefined = text.match(/^[a-z]+/i)?.toString()
            console.log("mode", mode)

            // if the mode is a known mode, define its formatter
            if (mode === undefined || /^((\"\")|sum|add|total|(adv|disadv)(antage)?)$/i.test(mode))

                // mode is sum/add/total
                if (mode !== undefined && /^(sum|add|total)$/i.test(mode))
                    diceReducer = (output: string, current: number | number[]): string => `${output} + [${current}]`

                // mode is adv/disadv
                else if (mode !== undefined && /^((adv|disadv)(antage)?).*/i.test(mode))
                    diceReducer = (output: string, current: number | number[]): string => `${output} or [${current}]`

                // mode is undefined (implicitly, it is list)
                else
                    diceReducer = (output: string, current: number | number[]): string => `${output}, [${current}]`


            // if unknown mode is specified, reply with error
            else {
                message.reply(`Error: ${mode} is not a valid mode`)
                return
            }

            // get each die or number individually -> inputs: string[]
            let inputs: string[] = text.split(" ").map(word => word.replace(",", "").trim())
            let output: { dice: (number | number[])[], modifier: string } = { dice: [], modifier: "" }
            let modifier: Modifier
            let rolls: (Dice | Dice[])[] = []

            // inputs: string[] -> commands: (Dice | Modifier)[]
            inputs.forEach(input => {

                // input is Dice
                if (/[0-9]+d[4,6,8,10,12,20]/i.test(input)) {
                    let quantity: string | undefined = input.match(/^[0-9]+/)?.toString()
                    let type: string | undefined = input.match(/[0-9]+$/)?.toString()

                    // add quantity d type dice to be rolled
                    if (quantity != undefined && type != undefined)
                        for (let i = 0; i < parseInt(quantity); i++) {

                            // if mode is adv/advantage or disadv/disadvantage, roll twice
                            if (mode !== undefined && /^((adv|disadv)(antage)?).*/i.test(mode))
                                rolls.push([new Dice(parseInt(type)), new Dice(parseInt(type))])

                            // else roll once
                            else
                                rolls.push(new Dice(parseInt(type)))
                        }
                }

                // input is Modifier
                else if (/^(\+|\-)[0-9]+/.test(input)) {
                    let regex: RegExpMatchArray | null = input.match(/(?<=(\+|\-))[0-9]+/)
                    if (regex !== null) {
                        let sign: string = regex[1]
                        let value: number = parseInt(regex[0])
                        modifier = new Modifier((sign === "-" ? -1 : 1) * value + parseInt(modifier?.value))
                        // let modifier: { sign: string, value: number } = { sign: regex[1], value: parseInt(regex[0]) }
                        // // let sign: string | undefined = input.match(/^(\+|-)/)?.toString()

                        // console.log(modifier)
                        // console.log(input.match(/^(\+|-)/))
                        // console.log(sign)
                        // modifiers.push(new Modifier((sign === "-" ? -1 : 1) * value))
                    }
                }
            })

            // rolls: (Dice | Dice[])[] -> output: (number | number[])[]
            output.dice = rolls.map(roll => roll instanceof Dice ? roll.evaluate() : roll.map(die => die.evaluate()))
            // output.modifiers = modifiers.map(modifier => modifier.value)
            let reply: string | undefined = `${output.dice.reduce(diceReducer, "")} ${output.modifier}`
            console.log(reply)
            reply = reply.match(/(?<=\,\s).*/)?.toString()
            message.reply(reply)
            console.log(output)

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