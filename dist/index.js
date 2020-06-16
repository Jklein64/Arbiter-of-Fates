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
        if (text !== undefined && /^roll\s+(((adv|disadv)(antage)?)|(sum|add|total))?\s*([0-9]+d(4|6|8|10|12|20))+(\s(\+\-)[0-9]+)?/i.test(message.content)) {
            let Cmd;
            (function (Cmd) {
                Cmd["Sum"] = "SUM";
                Cmd["Advantage"] = "ADV";
                Cmd["Disadvantage"] = "DISADV";
                Cmd["List"] = "LIST";
            })(Cmd || (Cmd = {}));
            // get the command type
            let command = (_b = text.match(/^[a-z]+/i)) === null || _b === void 0 ? void 0 : _b.toString();
            // command is Sum
            if (command && /^(sum|add|total)$/i.test(command))
                command = Cmd.Sum;
            // command is Advantage
            else if (command && /^(adv(antage)?).*/i.test(command))
                command = Cmd.Advantage;
            // command is Disadvantage
            else if (command && /^(disadv(antage)?).*/i.test(command))
                command = Cmd.Disadvantage;
            // command is List
            else if (command === undefined)
                command = Cmd.List;
            else {
                message.reply(`Hey dumbass, ${command} doesn't exist! Just like ur brain cells xD`);
                return;
            }
            // get each die or number individually
            let inputs = text.match(/([0-9]+d(4|6|8|10|12|20))|((\+|\-)\s?[0-9]+)/gi);
            let modifier = new Modifier(0);
            let rolls = [];
            // inputs are valid
            if (inputs)
                // inputs: string[] -> rolls: Dice[][]
                inputs.forEach(input => {
                    var _a, _b;
                    // input is Dice
                    if (/[0-9]+d(4|6|8|10|12|20)/gi.test(input)) {
                        let quantity = (_a = input.match(/^[0-9]+/)) === null || _a === void 0 ? void 0 : _a.toString();
                        let type = (_b = input.match(/(4|6|8|10|12|20)$/)) === null || _b === void 0 ? void 0 : _b.toString();
                        let dice;
                        // add quantity d type dice to be rolled
                        if (quantity && type) {
                            dice = Array(parseInt(quantity));
                            let adv = command === Cmd.Advantage;
                            let disadv = command === Cmd.Disadvantage;
                            dice.fill(new Dice(parseInt(type), adv, disadv));
                            rolls.push(dice);
                        }
                    }
                    // input is Modifier
                    else if (/^(\+|\-)\s?[0-9]+/g.test(input)) {
                        let regex = input.match(/(\+|\-)|[0-9]+/g);
                        if (regex) {
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
            let totalExpression = [];
            let totalEvaluation = [];
            for (let roll of rolls) {
                for (let dice of roll) {
                    let [expression, evaluation] = dice.data();
                    totalExpression.push(expression.value);
                    totalEvaluation.push(evaluation.value);
                }
            }
            console.log("total Evaluation", totalEvaluation);
            console.log("total Evaluation", totalEvaluation);
            if (command === Cmd.Sum) {
                totalExpression = totalExpression.join(" + ");
                totalEvaluation = `${totalEvaluation.reduce((sum, curr) => sum += curr) + modifier.value}`;
            }
            else {
                totalExpression = totalExpression.join(", ");
                totalEvaluation = totalEvaluation.map(num => num + modifier.value);
                totalEvaluation = totalEvaluation.join(", ");
            }
            console.log(command);
            let mod = "";
            if (modifier.value !== 0)
                mod = ` + ${modifier.value}`;
            let reply = `${totalExpression}${mod} = **${totalEvaluation}**`;
            console.log(reply);
            message.reply(reply);
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
    constructor(type, advantage = false, disadvantage = false) {
        this.type = type;
        this.advantage = advantage;
        this.disadvantage = disadvantage;
    }
    roll() {
        let num = Math.random();
        for (let roll = 1; roll <= this.type; roll++)
            if (num <= (roll / this.type))
                return roll;
        return this.type;
    }
    data() {
        // [expression, evaluation]
        let data = [new Expression(), new Evaluation()];
        // advantage XOR disadvantage
        if (this.advantage !== this.disadvantage) {
            let output = [this.roll(), this.roll()];
            data[0].value = `[${output.join(" or ")}]`;
            if (this.advantage)
                data[1].value = Math.max(...output);
            else
                data[1].value = Math.min(...output);
        }
        // only roll each die once
        else {
            let output = this.roll();
            console.log(output);
            data[0].value = `[${output}]`;
            data[1].value = output;
        }
        console.log("data", data);
        return data;
    }
}
class Expression {
    constructor(input = "") {
        this.value = input;
    }
    toString() {
        return this.value;
    }
}
class Evaluation {
    constructor(input = 0) {
        this.value = input;
    }
    toString() {
        return `${this.value}`;
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