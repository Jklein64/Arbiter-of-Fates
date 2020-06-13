"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client();
client.on("ready", () => {
    var _a;
    console.log(`logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
});
client.on("message", (message) => {
    var _a, _b;
    // dont' do anything in response to own messages
    if (message.author.username === "Arbiter of Fates")
        return;
    // the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {
        // get the part after the prefix
        let text = (_a = message.content.match(/(?<=roll\s).*/i)) === null || _a === void 0 ? void 0 : _a.toString();
        // let format: ((rolls: number[][], modifier: Modifier | null) => string) | null = null
        // let joiner: string = ""
        // is valid input (with or without a Command), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d[4,6,8,10,12,20])+(\s(\+\-)[0-9]+)?/i.test(message.content)) {
            let Command;
            (function (Command) {
                Command["Sum"] = "SUM";
                Command["Advantage"] = "ADV";
                Command["Disadvantage"] = "DISADV";
                Command["List"] = "LIST";
            })(Command || (Command = {}));
            // get the command type
            let command = (_b = text.match(/^[a-z]+/i)) === null || _b === void 0 ? void 0 : _b.toString();
            // command is Sum
            if (command && /^(sum|add|total)$/i.test(command))
                command = Command.Sum;
            // command is Advantage
            else if (command && /^(adv(antage)?).*/i.test(command))
                command = Command.Advantage;
            // command is Disadvantage
            else if (command && /^(disadv(antage)?).*/i.test(command))
                command = Command.Disadvantage;
            // command is List
            else if (command === undefined)
                command = Command.List;
            else {
                message.reply(`Hey dumbass, ${command} doesn't exist! Just like ur brain cells xD`);
                return;
            }
            console.log("mode", command);
            // // mode is Sum/Add/Total
            // if (command === Command.Sum) {
            //     joiner = " + "
            //     format = (rolls: number[][], modifier: Modifier | null): string => {
            //         let total: number = modifier ? modifier.value : 0
            //         rolls.forEach(roll => total += roll[0])
            //         return `**${total}**`
            //     }
            // }
            // // mode is Advantage or Disadvantage
            // else if (command === Command.Advantage || command === Command.Disadvantage) {
            //     joiner = " or "
            //     format = (rolls: number[][], modifier: Modifier | null): string => {
            //         let output: string[] = []
            //         for (const roll of rolls)
            //             if (command !== undefined && /^(adv(antage)?).*/i.test(command))
            //                 output.push(`[${roll.reduce((max, curr) => Math.max(max, curr), -Infinity) + (modifier !== null ? modifier.value : 0)}]`)
            //             else if (command !== undefined && /^(disadv(antage)?).*/i.test(command))
            //                 output.push(`[${roll.reduce((min, curr) => Math.min(min, curr), Infinity) + (modifier !== null ? modifier.value : 0)}]`)
            //         return `**${output.join(", ")}**`
            //     }
            // }
            // // mode is List
            // else if (command === Command.List) {
            //     joiner = ", "
            //     format = (rolls: number[][], modifier: Modifier | null): string => {
            //         let output: string[][] = []
            //         for (const roll of rolls)
            //             output.push(roll.map(number => `[${number + (modifier ? modifier.value : 0)}]`))
            //         return `**${output.join(", ")}**`
            //     }
            // }
            // if unknown mode is specified, reply with error
            // else {
            //     message.reply(`Error: ${command} is not a valid mode`)
            //     return
            // }
            // get each die or number individually -> inputs: string[]
            // let inputs: string[] = text.split(" ").map(word => word.replace(",", "").trim())
            let inputs = text.match(/([0-9]+d[4,6,8,10,12,20])|((\+|\-)\s?[0-9]+)/gi);
            console.log("inputs", inputs);
            // let output: { dice: number[][], modifier: Modifier | null } = { dice: [], modifier: null }
            let modifier = new Modifier(0);
            let rolls = [];
            // inputs: string[] -> rolls: Dice[][]
            inputs.forEach(input => {
                var _a, _b;
                // input is Dice
                if (/[0-9]+d[4,6,8,10,12,20]/gi.test(input)) {
                    let quantity = (_a = input.match(/^[0-9]+/)) === null || _a === void 0 ? void 0 : _a.toString();
                    let type = (_b = input.match(/[0-9]+$/)) === null || _b === void 0 ? void 0 : _b.toString();
                    let multiplier = command === Command.Advantage || command === Command.Disadvantage ? 2 : 1;
                    // add quantity d type dice to be rolled
                    if (quantity && type)
                        for (let i = 0; i < multiplier; i++) {
                            let dice = Array(parseInt(quantity));
                            rolls.push(dice.fill(new Dice(parseInt(type))));
                        }
                }
                // input is Modifier
                else if (/^(\+|\-)\s?[0-9]+/g.test(input)) {
                    let regex = input.match(/(\+|\-)|[0-9]+/g);
                    if (regex) {
                        console.log(regex);
                        let sign = parseInt(`${regex[0]}1`);
                        let value = parseInt(regex[1]);
                        let prev = modifier.value;
                        // make Modifier or add on to previous
                        modifier = new Modifier(sign * value + prev);
                    }
                }
            });
            let expression = [];
            let evaluation = [];
            // turn dice into expression and evaluation
            for (let roll of rolls) {
                let output = roll.map(dice => dice.evaluate());
                // command is Advantage or Disadvantage
                if (command === Command.Advantage || command === Command.Disadvantage) {
                    expression.push(`[${output.join(" or ")}]`);
                    // command is Advantage
                    if (command === Command.Advantage) {
                        let max = output.reduce((max, curr) => Math.max(max, curr), -Infinity);
                        evaluation.push(`${max + modifier.value}`);
                    }
                    // command is Disadvantage
                    else if (command === Command.Disadvantage) {
                        let min = output.reduce((min, curr) => Math.min(min, curr), Infinity);
                        evaluation.push(`${min + modifier.value}`);
                    }
                    console.log(evaluation);
                }
                // command is Sum/Add/Total
                else if (command === Command.Sum) {
                    expression.push(`[${output.join(" + ")}]`);
                    let prev = evaluation[0] ? parseInt(evaluation[0]) : modifier.value;
                    evaluation[0] = `${prev + output.reduce((total, curr) => total += curr)}`;
                    console.log(output.join(" + "));
                }
                // command is List
                else if (command === Command.List) {
                    expression.push(`[${output.join(", ")}]`);
                    evaluation.push(`${output.map(num => num + modifier.value).join(", ")}`);
                    console.log(output.join(", "));
                }
            }
            // let reply: string | string[][] = []
            // for (const rolls of output.dice)
            //     reply.push(rolls.map(roll => `[${roll + (output.modifier ? output.modifier.value : 0)}]`))
            // reply = `${reply.join(joiner)}`
            expression = expression.join(", ");
            evaluation = evaluation.join(", ");
            // if (format)
            //     expression += ` = ${format(output.dice, output.modifier)}`
            message.reply(`${expression} = **${evaluation}**`);
        }
        else {
            message.reply("That isn't a valid input ya doof");
            return;
        }
    }
});
client.login(process.env.TOKEN);
class Dice {
    constructor(type) {
        this.type = type;
    }
    evaluate() {
        let num = Math.random();
        for (let roll = 1; roll <= this.type; roll++)
            if (num < (roll / this.type))
                return roll;
        return this.type;
    }
}
class Modifier {
    constructor(value) {
        this.value = value;
    }
    toString() {
        if (this.value > 0)
            return `+${this.value}`;
        else
            return `${this.value}`;
    }
}
//# sourceMappingURL=index.js.map