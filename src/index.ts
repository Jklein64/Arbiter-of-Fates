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

    // if the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {

        // get the part after the prefix
        let text: string | undefined = message.content.match(/(?<=roll\s).*/i)?.toString()
        let formatter: ((output: string, current: number) => string) | null = null

        // if is valid input (with or without a mode), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]*d[4,6,8,10,12,20])+/i.test(message.content)) {

            // get the mode
            let mode: string | undefined = text.match(/^[a-z]+/i)?.toString()
            console.log("mode", mode)

            // if the mode is a known mode, process it
            if (mode === undefined || /^((\"\")|sum|add|total|(adv|disadv)(antage)?)$/i.test(mode))

                // mode is sum/add/total
                if (mode !== undefined && /^(sum|add|total)$/i.test(mode))
                    formatter = (output: string, current: number): string => `${output} + [${current}]`

                // mode is adv/disadv
                else if (mode !== undefined && /^((adv|disadv)(antage)?).*/i.test(mode))
                    formatter = (output: string, current: number): string => `${output} or [${current}]`

                // mode is undefined (implicitly list)
                else
                    formatter = (output: string, current: number): string => `${output}, [${current}]`


            // if no mode is specified or isn't recognized, reply with error
            else {
                message.reply(`Error: ${mode} is not a mode`)
                return
            }


            // get each die or number individually -> inputs: string[]
            let inputs: string[] = text.split(" ").map(word => word.replace(",", "").trim())
            let commands: (Dice | Modifier)[] = []
            let output: number[] = []

            // inputs: string[] -> commands: (Dice | Modifier)[]
            inputs.forEach(input => {

                // input is Modifier
                if (/\+[0-9]+/.test(input)) {
                    let modifier: string | undefined = input.match(/(?<=\+)[0-9]+/)?.toString()
                    if (modifier != undefined)
                        commands.push(new Modifier(parseInt(modifier)))
                }

                // input is Dice
                else if (/[0-9]+d[4,6,8,10,12,20]/i.test(input)) {
                    let quantity: string | undefined = input.match(/^[0-9]+/)?.toString()
                    let type: string | undefined = input.match(/[0-9]+$/)?.toString()
                    if (quantity != undefined && type != undefined)
                        for (let i = 0; i < parseInt(quantity); i++)
                            commands.push(new Dice(parseInt(type)))
                }
            })

            // commands: (Dice | Modifier)[] -> output: number[]
            output = commands.map(command => command.evaluate())
            console.log(output.reduce(formatter, ""))
        }

    } else {
        message.reply("That isn't a valid input")
        return
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
    private value: number

    constructor(value: number) {
        this.value = value
    }

    evaluate(): number {
        return this.value
    }
}