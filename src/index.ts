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
            enum Cmd {
                Sum = "SUM",
                Advantage = "ADV",
                Disadvantage = "DISADV",
                List = "LIST"
            }

            // get the command type
            let command: Cmd | string | undefined = text.match(/^[a-z]+/i)?.toString()

            // command is Sum
            if (command && /^(sum|add|total)$/i.test(command))
                command = Cmd.Sum

            // command is Advantage
            else if (command && /^(adv(antage)?).*/i.test(command))
                command = Cmd.Advantage

            // command is Disadvantage
            else if (command && /^(disadv(antage)?).*/i.test(command))
                command = Cmd.Disadvantage

            // command is List
            else if (command === undefined)
                command = Cmd.List

            else {
                message.reply(`Hey dumbass, ${command} doesn't exist! Just like ur brain cells xD`)
                return
            }

            // get each die or number individually
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
                            let adv = command === Cmd.Advantage
                            let disadv = command === Cmd.Disadvantage
                            dice.fill(new Dice(parseInt(type), adv, disadv))
                            rolls.push(dice)
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

            let totalExpression: string | string[] = []
            let totalEvaluation: string | number[] = []

            for (let roll of rolls) {
                for (let dice of roll) {
                    let [expression, evaluation] = dice.data()
                    totalExpression.push(expression.value)
                    totalEvaluation.push(evaluation.value)
                }
            }

            console.log("total Evaluation", totalEvaluation)
            console.log("total Evaluation", totalEvaluation)

            if (command === Cmd.Sum) {
                totalExpression = totalExpression.join(" + ")
                totalEvaluation = `${totalEvaluation.reduce((sum, curr) => sum += curr) + modifier.value}`
            } else {
                totalExpression = totalExpression.join(", ")
                totalEvaluation = totalEvaluation.map(num => num + modifier.value)
                totalEvaluation = totalEvaluation.join(", ")
            }

            console.log(command)
            let mod: string = ""
            if (modifier.value !== 0)
                mod = ` + ${modifier.value}`

            let reply = `${totalExpression}${mod} = **${totalEvaluation}**`
            console.log(reply)
            message.reply(reply)
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
    private advantage: boolean
    private disadvantage: boolean

    constructor(type: number, advantage = false, disadvantage = false) {
        this.type = type
        this.advantage = advantage
        this.disadvantage = disadvantage
    }

    private roll(): number {
        let num: number = Math.random()
        for (let roll = 1; roll <= this.type; roll++)
            if (num <= (roll / this.type))
                return roll
        return this.type
    }

    public data(): [Expression, Evaluation] {
        // [expression, evaluation]
        let data: [Expression, Evaluation] = [new Expression(), new Evaluation()]

        // advantage XOR disadvantage
        if (this.advantage !== this.disadvantage) {
            let output: [number, number] = [this.roll(), this.roll()]
            data[0].value = `[${output.join(" or ")}]`
            if (this.advantage)
                data[1].value = Math.max(...output)
            else
                data[1].value = Math.min(...output)
        }

        // only roll each die once
        else {
            let output: number = this.roll()
            console.log(output)
            data[0].value = `[${output}]`
            data[1].value = output
        }

        console.log("data", data)
        return data
    }
}

class Expression {
    public value: string

    constructor(input: string = "") {
        this.value = input
    }

    public toString(): string {
        return this.value
    }
}

class Evaluation {
    public value: number

    constructor(input: number = 0) {
        this.value = input
    }

    public toString(): string {
        return `${this.value}`
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