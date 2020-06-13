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
            // get each die or number individually -> inputs: string[]
            let inputs = text.match(/([0-9]+d[4,6,8,10,12,20])|((\+|\-)\s?[0-9]+)/gi);
            console.log("inputs", inputs);
            let modifier = new Modifier(0);
            let rolls = [];
            // inputs are valid
            if (inputs)
                // inputs: string[] -> rolls: Dice[][]
                inputs.forEach(input => {
                    var _a, _b;
                    // input is Dice
                    if (/[0-9]+d[4,6,8,10,12,20]/gi.test(input)) {
                        let quantity = (_a = input.match(/^[0-9]+/)) === null || _a === void 0 ? void 0 : _a.toString();
                        let type = (_b = input.match(/[0-9]+$/)) === null || _b === void 0 ? void 0 : _b.toString();
                        let dice;
                        // add quantity d type dice to be rolled
                        if (quantity && type) {
                            if (command === Command.Advantage || command === Command.Disadvantage)
                                dice = Array(parseInt(quantity) * 2);
                            else
                                dice = Array(parseInt(quantity));
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
            // inputs are invalid
            else {
                message.reply("Hey, no fair.  That wasn't a die, command, or modifier");
                return;
            }
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
            // format expression and evaluation
            expression = expression.join(", ");
            evaluation = evaluation.join(", ");
            // reply to the message
            message.reply(`${expression} = **${evaluation}**`);
        }
        // invalid input
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