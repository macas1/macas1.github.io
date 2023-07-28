// import { loadLocalText } from "../shared/data.js"

// const armour_head_json = "armour_head.json"
// const armour_body_json = "armour_body.json"
// const armour_legs_json = "armour_body.json"
// const armour_hands_json = "armour_legs.json"

// var armour_head
// var armour_body
// var armour_legs
// var armour_gloves

// async function loadAllArmour() {
//     armour_head = await loadAllArmour(armour_head_json)
//     armour_body = await loadAllArmour(armour_body_json)
//     armour_legs = await loadAllArmour(armour_legs_json)
//     armour_gloves = await loadAllArmour(armour_hands_json)

//     console.log(armour_body)
// }

import data from '../data/armour_body.json' assert { type: 'json' };
console.log(data);