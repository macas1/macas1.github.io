import armour_body from './data/armour_body.json' assert { type: 'json' };
import armour_hands from './data/armour_hands.json' assert { type: 'json' };
import armour_head from './data/armour_head.json' assert { type: 'json' };
import armour_legs from './data/armour_legs.json' assert { type: 'json' };
import constants from './data/constants.json' assert { type: 'json' };

class ArmourSet {
    constructor(body, hands, head, legs) {
        this.body = body
        this.hands = hands
        this.head = head
        this.legs = legs
    }

    getValue(value_name) {
        switch(value_name) {
            case "Body": body["Name"]
                return 
            case "Hands":
                return hands["Name"]
            case "Head":
                return head["Name"]
            case "Legs":
                return legs["Name"]
            default:
                return this.body[value_name] + this.hands[value_name] + this.head[value_name] + this.legs[value_name]
        }
    }

    generateRow() {
        const row = document.createElement("tr")
        for (const value in constants["TableHeaders"]) {
            let cell = document.createElement("td")
            cell.innerText = getValue[value]
            row.appendChild(cell)
        }
        return row
    }
}

// Init
function main() {
    update_value_ranges()
    create_results_headers()
}

function create_results_headers() {
    const row = document.createElement("tr")
    for (const index in constants["TableHeaders"]) {
        let cell = document.createElement("th")
        cell.innerText = constants["TableHeaders"][index]
        row.appendChild(cell)
    }
    document.getElementById("resultsTable").appendChild(row)
}

function update_value_ranges() {
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
            values[stat].min = calcMin(values[stat].min, set.getValue(stat))
            values[stat].max = calcMax(values[stat].max, set.getValue(stat))
        }
    })

    console.log(values)
    setupNumberInputValues("maxWeightInput", values["Weight"], 50)
    setupNumberInputValues("minArmourInput", values["Armour"])
    setupNumberInputValues("minBleedInput",  values["Bleed"])
    setupNumberInputValues("minFireInput",   values["Fire"])
    setupNumberInputValues("minShockInput",  values["Shock"])
    setupNumberInputValues("minBlightInput", values["Blight"])
    setupNumberInputValues("minToxinInput",  values["Toxin"])
}

function setupNumberInputValues(id, values, default_value=null) {
    const e = document.getElementById(id)
    e.min = values.min
    e.max = values.max
    e.value = default_value == null ? e.min : default_value
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

// Interactive
export function generateTable() {
    const table = document.getElementById("resultsTable")

    // TODO: link these with constants: VALUE, ID
    const min_values = {
        "Armour": document.getElementById("minArmourInput").value,
        "Bleed":  document.getElementById("minBleedInput").value,
        "Fire":   document.getElementById("minFireInput").value,
        "Shock":  document.getElementById("minShockInput").value,
        "Blight": document.getElementById("minBlightInput").value,
        "Toxin":  document.getElementById("minToxinInput").value
    }

    const max_values = {
        "Weight": document.getElementById("maxWeightInput").value
    }

    while (table.rowCount > 1) {
        table.deleteRow(rowCount -1);
    }

    permSets(set => {
        for (const stat in min_Values) {
            if (set.getValue[stat] < min_values[stat]) { 
                return 
            }
        }
        for (const stat in max_Values) {
            if (set.getValue[stat] > max_Values[stat]) { 
                return 
            }
        }

        table.appendChild(set.generateRow())
    })
}

// Run main
main()