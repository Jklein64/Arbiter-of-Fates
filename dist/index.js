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
    // if the message matches the roll prefix
    if (/^roll\s.+/i.test(message.content)) {
        // get the part after the prefix
        let text = (_a = message.content.match(/(?<=roll\s).*/i)) === null || _a === void 0 ? void 0 : _a.toString();
        let joiner = "";
        let diceReducer = null;
        let format = null;
        // if is valid input (with or without a mode), process it
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d[4,6,8,10,12,20])+(\s(\+\-)[0-9]+)?/i.test(message.content)) {
            let Command;
            (function (Command) {
                Command["Sum"] = "SUM";
                Command["Advantage"] = "ADV";
                Command["Disadvantage"] = "DISADV";
                Command["List"] = "LIST";
            })(Command || (Command = {}));
            // get the mode
            let command = (_b = text.match(/^[a-z]+/i)) === null || _b === void 0 ? void 0 : _b.toString();
            if (command && /^(sum|add|total)$/i.test(command))
                command = Command.Sum;
            else if (command && /^(adv(antage)?).*/i.test(command))
                command = Command.Advantage;
            else if (command && /^(disadv(antage)?).*/i.test(command))
                command = Command.Disadvantage;
            else if (command === undefined)
                command = Command.List;
            console.log("mode", command);
            // mode is sum/add/total
            if (command === Command.Sum) {
                // diceReducer = (output: string, current: number[]): string => `${output} + [${current}]`
                joiner = " + ";
                format = (rolls, modifier) => {
                    let total = modifier ? parseInt(modifier.value) : 0;
                    rolls.forEach(roll => total += roll[0]);
                    return `**${total}**`;
                };
            }
            // mode is adv/disadv
            else if (command === Command.Advantage || command === Command.Disadvantage) {
                // diceReducer = (output: string, current: number[]): string => `${output} or [${current}]`
                joiner = " or ";
                format = (rolls, modifier) => {
                    let output = [];
                    for (const roll of rolls)
                        if (command !== undefined && /^(adv(antage)?).*/i.test(command))
                            output.push(`[${roll.reduce((max, curr) => Math.max(max, curr), -Infinity) + (modifier ? parseInt(modifier.value) : 0)}]`);
                        else if (command !== undefined && /^(disadv(antage)?).*/i.test(command))
                            output.push(`[${roll.reduce((min, curr) => Math.min(min, curr), Infinity) + (modifier ? parseInt(modifier.value) : 0)}]`);
                    return `**${output.join(", ")}**`;
                };
            }
            // mode is undefined (implicitly, it is list)
            else if (command === Command.List) {
                // diceReducer = (output: string, current: number[]): string => `${output}, [${current}]`
                joiner = ", ";
                format = (rolls, modifier) => {
                    let output = [];
                    for (const roll of rolls)
                        output.push(roll.map(number => `[${number + (modifier ? parseInt(modifier.value) : 0)}]`));
                    return `**${output.join(", ")}**`;
                };
            }
            // if unknown mode is specified, reply with error
            else {
                message.reply(`Error: ${command} is not a valid mode`);
                return;
            }
            // get each die or number individually -> inputs: string[]
            let inputs = text.split(" ").map(word => word.replace(",", "").trim());
            let output = { dice: [], modifier: "" };
            let rolls = [];
            let modifier = null;
            // inputs: string[] -> rolls: Dice[][]
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
                            if (command !== undefined && /^((adv|disadv)(antage)?).*/i.test(command))
                                rolls.push([new Dice(parseInt(type)), new Dice(parseInt(type))]);
                            // else roll once
                            else
                                rolls.push([new Dice(parseInt(type))]);
                        }
                }
                // input is Modifier
                else if (/^(\+|\-)[0-9]+/.test(input)) {
                    let regex = input.match(/(?<=(\+|\-))[0-9]+/);
                    if (regex !== null) {
                        let sign = regex[1];
                        let value = parseInt(regex[0]);
                        if (modifier)
                            modifier = new Modifier((sign === "-" ? -1 : 1) * value + parseInt(modifier.value));
                        else
                            modifier = new Modifier((sign === "-" ? -1 : 1) * value);
                        output.modifier = modifier.value;
                    }
                }
            });
            // rolls: Dice[][] -> output: number[][]
            output.dice = rolls.map(roll => roll.map(die => die.evaluate()));
            let reply = [];
            for (const roll of output.dice)
                reply.push(roll.map(number => `[${number + (modifier ? parseInt(modifier.value) : 0)}]`));
            reply = `${reply.join(joiner)}`;
            if (format)
                reply += ` = ${format(output.dice, modifier)}`;
            message.reply(reply);
            if (format !== null && modifier !== undefined) {
                console.log(format(output.dice, modifier));
            }
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
        if (value > 0)
            this.value = `+${value}`;
        else
            this.value = `${value}`;
    }
}
//# sourceMappingURL=index.js.map