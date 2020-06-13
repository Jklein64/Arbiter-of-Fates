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
    // if the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {
        // get the part after the prefix
        let text = (_a = message.content.match(/(?<=roll\s).*/i)) === null || _a === void 0 ? void 0 : _a.toString();
        let formatter = null;
        // if is valid input (with or without a mode), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]*d[4,6,8,10,12,20])+/i.test(message.content)) {
            // get the mode
            let mode = (_b = text.match(/^[a-z]+/i)) === null || _b === void 0 ? void 0 : _b.toString();
            console.log("mode", mode);
            // if the mode is a known mode, process it
            if (mode === undefined || /^((\"\")|sum|add|total|(adv|disadv)(antage)?)$/i.test(mode))
                // mode is sum/add/total
                if (mode !== undefined && /^(sum|add|total)$/i.test(mode))
                    formatter = (output, current) => `${output} + [${current}]`;
                // mode is adv/disadv
                else if (mode !== undefined && /^((adv|disadv)(antage)?).*/i.test(mode))
                    formatter = (output, current) => `${output} or [${current}]`;
                // mode is undefined (implicitly list)
                else
                    formatter = (output, current) => `${output}, [${current}]`;
            // if no mode is specified or isn't recognized, reply with error
            else {
                message.reply(`Error: ${mode} is not a mode`);
                return;
            }
            // get each die or number individually -> inputs: string[]
            let inputs = text.split(" ").map(word => word.replace(",", "").trim());
            let commands = [];
            let output = [];
            // inputs: string[] -> commands: (Dice | Modifier)[]
            inputs.forEach(input => {
                var _a, _b, _c;
                // input is Modifier
                if (/\+[0-9]+/.test(input)) {
                    let modifier = (_a = input.match(/(?<=\+)[0-9]+/)) === null || _a === void 0 ? void 0 : _a.toString();
                    if (modifier != undefined)
                        commands.push(new Modifier(parseInt(modifier)));
                }
                // input is Dice
                else if (/[0-9]+d[4,6,8,10,12,20]/i.test(input)) {
                    let quantity = (_b = input.match(/^[0-9]+/)) === null || _b === void 0 ? void 0 : _b.toString();
                    let type = (_c = input.match(/[0-9]+$/)) === null || _c === void 0 ? void 0 : _c.toString();
                    if (quantity != undefined && type != undefined)
                        for (let i = 0; i < parseInt(quantity); i++)
                            commands.push(new Dice(parseInt(type)));
                }
            });
            // commands: (Dice | Modifier)[] -> output: number[]
            output = commands.map(command => command.evaluate());
            console.log(output.reduce(formatter, ""));
        }
    }
    else {
        message.reply("That isn't a valid input");
        return;
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
    evaluate() {
        return this.value;
    }
}
//# sourceMappingURL=index.js.map