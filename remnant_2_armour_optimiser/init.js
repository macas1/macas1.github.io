import armour_body from './data/armour_body.json' assert { type: 'json' };
import armour_hands from './data/armour_hands.json' assert { type: 'json' };
import armour_head from './data/armour_head.json' assert { type: 'json' };
import armour_legs from './data/armour_legs.json' assert { type: 'json' };

class ArmourSet {
    constructor(body, hands, head, legs) {
        this.body = body
        this.hands = hands
        this.head = head
        this.legs = legs
    }

    getSum(value_name) {
        return this.body[value_name] + this.hands[value_name] + this.head[value_name] + this.legs[value_name]
    }
}


function main() {
    update_value_ranges()
}

function update_value_ranges() {
    // Check for min and max values
    let values = {
        "Armour":   { min: undefined, max: undefined },
        "Weight":   { min: undefined, max: undefined },
        "Bleed":    { min: undefined, max: undefined },
        "Fire":     { min: undefined, max: undefined },
        "Shock":    { min: undefined, max: undefined },
        "Blight":   { min: undefined, max: undefined },
        "Toxin":    { min: undefined, max: undefined }
    }

    permSets(set => {
        for (const stat in values) {
            values[stat].min = calcMin(values[stat].min, set.getSum(stat))
            values[stat].max = calcMax(values[stat].max, set.getSum(stat))
        }
    })

    // Do things with values
    console.log(values)
    setupNumberInputValues("maxWeightInput", values["Weight"], false)
    setupNumberInputValues("minArmourInput", values["Armour"])
    setupNumberInputValues("minBleedInput",  values["Bleed"])
    setupNumberInputValues("minFireInput",   values["Fire"])
    setupNumberInputValues("minShockInput",  values["Shock"])
    setupNumberInputValues("minBlightInput", values["Blight"])
    setupNumberInputValues("minToxinInput",  values["Toxin"])
}

function setupNumberInputValues(id, values, setValueToMin=true) {
    const e = document.getElementById(id)
    e.min = values.min
    e.max = values.max
    e.value = setValueToMin ? e.min : e.max
}

function calcMin(old, current) {
    if (old == undefined) { return current }
    return Math.min(old, current)
}

function calcMax(old, current) {
    if (old == undefined) { return current }
    return Math.max(old, current)
}

function permSets(withEachSet) {
    armour_body.forEach(body => {
        armour_hands.forEach(hands => {
            armour_head.forEach(head => {
                armour_legs.forEach(legs => {
                    withEachSet(new ArmourSet(body, hands, head, legs))
                })
            })
        })
    })
}

main()