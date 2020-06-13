"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client();
client.on("ready", () => {
    var _a;
    console.log(`logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
    // let dice: Dice[] = []
    // let counts: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
    // let count: number = 10000
    // for (let i = 0; i < count; i++)
    //     dice.push(new Dice(8))
    // let output: number[] = dice.map(die => die.run())
    // output.forEach(num => counts[num - 1]++);
    // console.log(counts.map(number => number / count))
});
client.on("message", (message) => {
    var _a, _b;
    // dont' do anything in response to own messages
    if (message.author.username === "Arbiter of Fates")
        return;
    // if the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {
        // get the part after the prefix
        let text = (_a = message.content.match(/(?<=roll\s).*/i)) === null || _a === void 0 ? void 0 : _a.toString();
        let diceReducer = null;
        // if is valid input (with or without a mode), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d[4,6,8,10,12,20])+(\s(\+\-)[0-9]+)?/i.test(message.content)) {
            // get the mode
            let mode = (_b = text.match(/^[a-z]+/i)) === null || _b === void 0 ? void 0 : _b.toString();
            console.log("mode", mode);
            // if the mode is a known mode, define its formatter
            if (mode === undefined || /^((\"\")|sum|add|total|(adv|disadv)(antage)?)$/i.test(mode))
                // mode is sum/add/total
                if (mode !== undefined && /^(sum|add|total)$/i.test(mode))
                    diceReducer = (output, current) => `${output} + [${current.evaluate()}]`;
                // mode is adv/disadv
                else if (mode !== undefined && /^((adv|disadv)(antage)?).*/i.test(mode))
                    diceReducer = (output, current) => `${output} or [${current.evaluate()}]`;
                // mode is undefined (implicitly, it is list)
                else
                    diceReducer = (output, current) => `${output}, [${current.evaluate()}]`;
            // if unknown mode is specified, reply with error
            else {
                message.reply(`Error: ${mode} is not a valid mode`);
                return;
            }
            // get each die or number individually -> inputs: string[]
            let inputs = text.split(" ").map(word => word.replace(",", "").trim());
            let output = { dice: [], modifiers: [] };
            let modifiers = [];
            let rolls = [];
            // inputs: string[] -> commands: (Dice | Modifier)[]
            inputs.forEach(input => {
                var _a, _b;
                // input is Dice
                if (/[0-9]+d[4,6,8,10,12,20]/i.test(input)) {
                    let quantity = (_a = input.match(/^[0-9]+/)) === null || _a === void 0 ? void 0 : _a.toString();
                    let type = (_b = input.match(/[0-9]+$/)) === null || _b === void 0 ? void 0 : _b.toString();
                    // add quantity d type dice to be rolled
                    if (quantity != undefined && type != undefined)
                        for (let i = 0; i < parseInt(quantity); i++) {
                            // if mode is adv/advantage or disadv/disadvantage, roll twice
                            if (mode !== undefined && /^((adv|disadv)(antage)?).*/i.test(mode))
                                rolls.push([new Dice(parseInt(type)), new Dice(parseInt(type))]);
                            // else roll once
                            else
                                rolls.push(new Dice(parseInt(type)));
                        }
                }
                // input is Modifier
                else if (/^(\+|\-)[0-9]+/.test(input)) {
                    let regex = input.match(/(?<=(\+|\-))[0-9]+/);
                    if (regex !== null) {
                        let sign = regex[1];
                        let value = parseInt(regex[0]);
                        let modifier = { sign: regex[1], value: parseInt(regex[0]) };
                        // let sign: string | undefined = input.match(/^(\+|-)/)?.toString()
                        console.log(modifier);
                        console.log(input.match(/^(\+|-)/));
                        console.log(sign);
                        modifiers.push(new Modifier((sign === "-" ? -1 : 1) * value));
                    }
                }
            });
            // commands: (Dice | Modifier)[] -> output: number[]
            output.dice = rolls.map(roll => {
                if (roll instanceof Dice)
                    return roll.evaluate();
                else
                    return roll.map(die => die.evaluate());
            });
            output.modifiers = modifiers.map(modifier => modifier.value);
            console.log(output);
            // console.log(commands.reduce(formatter, ""))
        }
        else {
            message.reply("That isn't a valid input");
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
        if (value > 0)
            this.value = `+${value}`;
        else
            this.value = `${value}`;
    }
}
//# sourceMappingURL=index.js.map