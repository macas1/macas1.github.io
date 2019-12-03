/*
Notes:
    - When a sentence overwraps from one side of the PDF to the other,
      there is no space between the two words. This will have to be fixed
      manually for the time being.

    - Please read through and check all infromatioon and the staff profile link
*/

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------
var settings = settings_lg_parser;

// ----------------------------------------------------------------------------
// Onload
// ----------------------------------------------------------------------------
window.onload = function(){
    var back_button = document.getElementById("back_button");
    var lg_button = document.getElementById("LG_button");
    var lg_input = document.getElementById("LG_input");
    var lg_text = document.getElementById("LG_text");

    back_button.onclick = function(){
        window.location.href = "index.html";
    }

    lg_button.onclick = function(){
        LG_input.click();
    }

    lg_input.addEventListener("change", function(){
        // Get text
        var text, gen;
        text = "File: " + lg_input.value.replace(/^.*[\\\/]/, '');
        if(text.length > 24){
            text = text.substring(0, 23) + "...";
        }

        // Remove old generated elements
        gen = document.getElementsByClassName("generated");
        while(gen.length > 0){
            console.log(gen[i]);
            for(var i=0; i<gen.length; i++){
                gen[i].remove();
            }
            gen = document.getElementsByClassName("generated");
        }

        // Load new LG
        load_lg();
        lg_text.innerHTML = text;
    });
}

// ----------------------------------------------------------------------------
// String functions
// ----------------------------------------------------------------------------
function trim_numbers(string){
    //TODO: This is unsafe as if a string ends with a number, that number is removed.
    var last_removed_dot = false;
    while(true){
        if(isNumber(string[string.length-1]) || string[string.length-1] == " "){
            if(string[string.length-2] == "."){
                string = string.slice(0, -2);
                last_removed_dot = true;
            }else{
                string = string.slice(0, -1);
                last_removed_dot = false;
            }
        }else{
            break;
        }
    }
    if(last_removed_dot){
        string += ".";
    }
    return string;
}

function comp_string(a, b, exact=false){
    if(exact){
        return a.toLowerCase().replace(/\s/g,'').trim() === b.toLowerCase().replace(/\s/g,'').trim();
    }
    return a.toLowerCase().replace(/\s/g,'').trim() == b.toLowerCase().replace(/\s/g,'').trim();
}

function remove_spaces(string){
    while(string.includes("  ")){
        string = string.replace("  ", " ");
    }
    return string.trim();
}

function format_str(string){
    return remove_spaces(trim_numbers(string));
}

function getSubstringPos(string, subString, n){
    var len = string.length;
    var i = -1;
    while(n-- && i++ < len){
        i = string.indexOf(subString, i);
        if (i < 0){
            break;
        }
    }
    return i;
}

function isLetter(str){
    return str.match(/[a-z]/i);
}

function isNumber(str){
    if(!str){
        return false;
    }
    return str.match(/[0-9]/i);
}

function capitalise(str){
    if(!str){
        return str;
    }
    return str.charAt(0).toUpperCase() + str.substring(1);
}

function copyStringToClipboard (str) {
   // Create new element
   var el = document.createElement('textarea');
   // Set value (string to be copied)
   el.value = str;
   // Set non-editable to avoid focus and move outside of view
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   // Select text inside element
   el.select();
   // Copy text to clipboard
   document.execCommand('copy');
   // Remove temporary element
   document.body.removeChild(el);
}

// ----------------------------------------------------------------------------
// Get text from pdf
// ----------------------------------------------------------------------------
function load_lg(){
	pdfjsLib.workerSrc = 'plugins/pdf.worker.js';
    const file = document.getElementById("LG_input").files[0];
	const reader = new FileReader();

	reader.onload = function() {
        const resultArray = new Int8Array(reader.result);
        var prom = getPfdPromise(resultArray);

        return prom.then(function(result){
            // We have the pdfText here, do things here;
            var pdf = {text:result};
            parse_lg(pdf);
            populate_page(pdf);
        }, function(err) {
            console.log(err); // Error: "It broke"
        });
    }
  	reader.readAsArrayBuffer(file);
}

function getPfdPromise(pdfUrl){
    var pdf = pdfjsLib.getDocument({data: pdfUrl});
    return pdf.then(function(pdf) { // get all pages text
        console.log(pdf);
        var maxPages = pdf._pdfInfo.numPages;
        var countPromises = []; // collecting all page promises
        for (var j = 1; j <= maxPages; j++) {
            var page = pdf.getPage(j);

            var txt = "";
            countPromises.push(page.then(function(page) { // add page promise
                var textContent = page.getTextContent();
                return textContent.then(function(text){ // return content promise
                    return text.items.map(function (s) { return s.str; }).join(''); // value page text
                });
            }));
        }
        // Wait for all pages and join text
        return Promise.all(countPromises).then(function (texts) {
            return texts.join('');
        });
    });
}

function get_main_section(pdf, heading_arr, mod=0){
    var heading = "";
    var result = "";
    var pos, end_pos;

    // Get Correct Heading
    for(var i = 0; i < heading_arr.length; i++){
        if(pdf.contents.includes(heading_arr[i])){
            heading = heading_arr[i];
            break;
        }
    }
    if(heading==""){
        return "";
    }

    // Get initial pos
    pos = getSubstringPos(pdf.text, heading, 2+mod) + heading.length;

    // Get ending pos (heading after intro)
    if(pdf.contents.indexOf(heading) < pdf.contents.length-1){
        pos_end = getSubstringPos(pdf.text, pdf.contents[pdf.contents.indexOf(heading)+1], 2+mod)
    }else{
        pos_end = pdf.text.length;
    }

    // Fill and return intro
    for(pos; pos < pos_end; pos++){
        result += pdf.text[pos];
    }



    return result
}

// ----------------------------------------------------------------------------
// Get Data from PDF text
// ----------------------------------------------------------------------------
function parse_lg(pdf){
    add_contents(pdf);
    add_intro(pdf);
    add_ULOs(pdf);
    add_assessmentSum(pdf);
    add_textbooks(pdf);
    add_equipment(pdf);
    add_coordinators(pdf);
    add_unitName(pdf)
    console.log(pdf);
}

function add_contents(pdf){
    // Currently splits at numbers and ignores spaces
    var pos = pdf.text.indexOf("Contents") + 8;
    var conts = [];
    var current = "";
    var chr;
    var parentheses_depth = 0;

    while(!conts.includes(current) && pos < pdf.text.length){
        chr = pdf.text[pos];

        if((!isNumber(chr) && chr != ".") || parentheses_depth > 0){
            current += chr;
        }

        if(isNumber(chr) && parentheses_depth == 0){
            if(current != ""){
                conts.push(remove_spaces(current));
            }
            current = "";
        }

        if(chr == "("){
            parentheses_depth++;
        }

        if(chr == ")"){
            if(parentheses_depth > 0){
                parentheses_depth--;
            }
        }
        pos++;
    }
    pdf.contents = conts;
}

function add_intro(pdf){
    var block;
    block = format_str(get_main_section(pdf, settings.headings.welcome))
    if(block){
        pdf.welcome = block;
    }
}

function add_ULOs(pdf){
    var num = 1;
    var ULOs = [];
    var current = "";
    var chr, chr2, chr3;
    var parentheses_depth = 0;
    var stopstr = "At the successful completion of this unit, students will be able to:";
    var block = format_str(get_main_section(pdf, settings.headings.ULOs));
    if(block.includes(stopstr)){
        block = block.substring(
            block.indexOf(stopstr) + stopstr.length,
            block.length
        );
    }

    for(var i = 0; i < block.length; i++){
        chr = block[i];

        chr2 = " ";
        if(i < block.length-1){
            chr2 = block[i+1];
        }

        chr3 = " ";
        if(i < block.length-2){
            chr3 = block[i+2];
        }

        current += chr;

        if(chr2==num && chr3!=num && parentheses_depth == 0){
            if(chr2 != 1 && current){
                ULOs.push(capitalise(remove_spaces(current)));
            }
            current = "";
            num++;
            i++;
        }

        if(chr == "("){
            parentheses_depth++;
        }

        if(chr == ")"){
            if(parentheses_depth > 0){
                parentheses_depth--;
            }
        }
    }

    if(current){
      ULOs.push(capitalise(remove_spaces(current)));
    }

    pdf.ULOs = ULOs;
}

function add_assessmentSum(pdf){
    var block = format_str(get_main_section(pdf, settings.headings.assessmentSum));
    var select_str = "ItemWeightDue DateULOs AssessedThreshold";
    var select_str2 = ["Curriculum Mode: ", "Rationale"]
    var pos = block.indexOf(select_str) + select_str.length;
    var current = {text:"", weight:""};
    var assessments = [];
    var chr;
    var parentheses_depth = 0;

    while(pos < block.length){
        chr = block[pos];
        if(chr != "%" || parentheses_depth > 0){
            current.text += chr;
        }else{
            // Get number from behind
            for(var i=1; i<4; i++){
                if(isNumber(block[pos-i])){
                    current.weight = block[pos-i] + current.weight;
                }else{
                    break;
                }
            }

            // Add current
            assessments.push(current);
            current = {text:"", weight:""};

            // Continue unitll a stopping point
            while(pos < block.length){
                if(isNumber(block[pos])){
                    if(pos < block.length-3 && block[pos+1].toLowerCase()=="y" && block[pos+2]=="e" && block[pos+3].toLowerCase()=="s"){
                        pos += 3;
                        break;
                    }else if(pos < block.length-2 && block[pos+1].toLowerCase()=="n" && block[pos+2]=="o"){
                        pos +=2;
                        break
                    }
                }
                pos++;
            }
            parentheses_depth = 0;
        }

        if(chr == "("){
            parentheses_depth++;
        }

        if(chr == ")"){
            if(parentheses_depth > 0){
                parentheses_depth--;
            }
        }
        pos++;
    }

    if(assessments.length<1){
        return;
    }

    for(var i=0; i<assessments.length; i++){
        // Fix weights
        while(assessments[i].weight>100){
            assessments[i].weight = assessments[i].weight.substr(1);
        }

        // Remove weight from text and match to contents
        assessments[i].text = assessments[i].text.slice(0, -(assessments[i].weight.length));
        for(var j=0; j<pdf.contents.length; j++){
            if(comp_string(assessments[i].text, pdf.contents[j])){
                assessments[i].text = pdf.contents[j];
                break;
            }
        }

        // Get type
        pos = getSubstringPos(pdf.text, "Curriculum Mode:", i+1) + "Curriculum Mode:".length;
        assessments[i].type = "";
        for(var j=0; j<settings.headings.curriculumModes.length; j++){
            if(comp_string(pdf.text.substring(pos, pos+settings.headings.curriculumModes[j].length), settings.headings.curriculumModes[j]) && settings.headings.curriculumModes[j].length > assessments[i].type.length){
                assessments[i].type = settings.headings.curriculumModes[j];
            }
        }
        if(assessments[i].type == ""){
            assessments[i].type = "Unknown Corriculum mode. Please update json."
        }
    }

    pdf.assSum = assessments;
}

function add_textbooks(pdf){
    var block = format_str(get_main_section(pdf, settings.headings.readings));
    var start_pos = -1;
    var end_pos = -1;

    // get pos
    for(var i = 0; i < settings.headings.textbook.length; i++){
        if(block.includes(settings.headings.textbook[i])){
            start_pos = block.indexOf(settings.headings.textbook[i]) + settings.headings.textbook[i].length;
            break;
        }
    }
    if(start_pos == -1){
        return;
    }

    for(var i = 0; i < settings.endheadings.textbook.length; i++){
        if(block.includes(settings.endheadings.textbook[i])){
            end_pos = block.indexOf(settings.endheadings.textbook[i]);
            break;
        }
    }
    if(end_pos == -1){
        return;
    }

    pdf.textbooks = block.substring(start_pos, end_pos).split(String.fromCharCode(8211) + " ");
    pdf.textbooks.shift();
    if(!pdf.textbooks){
        pdf.textbooks = ["No prescribed textbook."];
    }
}

function add_equipment(pdf){
    var final;
    var equip = pdf.text.substring(
        pdf.text.indexOf("Essential Equipment:")+"Essential Equipment:".length,
        pdf.text.indexOf("Legislative Pre-Requisites:")
    );

    if(equip){
        equip = equip.split(", ");
        final = equip[equip.length-1];
        equip.pop();
        equip = equip.concat(final.split(" and "));

        for(var i=0; i<equip.length; i++){
            equip[i] = capitalise(equip[i]);
        }

        pdf.equipment = equip;

    }else{
        pdf.equipment = ["NA"];
    }
}

function add_coordinators(pdf){
    var pos, coord, block, end_pos, poses;
    var contents_pos = pdf.text.indexOf("Contents");
    var coords = [];

    // Get existing titles and starting pos
    for(var i=0; i<settings.headings.coordinators.length; i++){
        pos = pdf.text.indexOf(settings.headings.coordinators[i] + "Name:");

        if(pos >= 0 && pos < contents_pos){
            coord = {title: settings.headings.coordinators[i], pos: pos};
            coords.push(coord);
        }
    }

    for(var i=0; i<coords.length; i++){
        //Get all end_pos's
        pos = contents_pos;
        for(var j=0; j<coords.length; j++){
            if(pos > coords[j].pos && coords[j].pos > coords[i].pos){
                pos = coords[j].pos;
            }
        }

        // Get block from end pos
        block = pdf.text.substring(coords[i].pos, pos);

        // Strip end of block
        for(var j=0; j<settings.endheadings.coordinators.length; j++){
            if(block.includes(settings.endheadings.coordinators[i])){
                block = block.split(settings.endheadings.coordinators[i])[0];
            }
        }

        // Get subheadings pos's
        poses = [];
        for(var j=0; j<settings.subheadings.coordinators.length; j++){
            pos = block.indexOf(settings.subheadings.coordinators[j] + ":");
            console.log(settings.subheadings.coordinators[j] + ":", pos);
            if(pos>=0){
                poses.push({title:settings.subheadings.coordinators[j],
                            pos:pos // + (settings.subheadings.coordinators[j] + ":").length
                });
            }
        }

        // Get subheadings
        console.log(poses);
        for(var j=0; j<poses.length; j++){
            // Get end of heading data pos
            pos = block.length;
            for(var k=0; k<poses.length; k++){
                if(pos > poses[k].pos && poses[k].pos > poses[j].pos){
                    pos = poses[k].pos;
                }
            }

            // Add heading data
            coords[i][poses[j].title] = remove_spaces(block.substring(
                poses[j].pos + poses[j].title.length + 1,
                pos
            ));

            coords[i].title = format_str(coords[i].title);
            delete coords[i].pos;
        }
    }
    pdf.coordinators = coords;
}

function add_unitName(pdf){
    var block = pdf.text.substring(pdf.text.indexOf("Unit Name:") + "Unit Name:".length,
                                   pdf.text.indexOf("Credit Points:"));
    if(block){
        pdf.unit_name = capitalise(block)
    }
}

// ----------------------------------------------------------------------------
// Populate page
// ----------------------------------------------------------------------------
function populate_page(pdf){
    var box, button, title, info;
    // title, html
    objects = [];
    populate_welcome(objects, pdf);
    populate_ULOs(objects, pdf);
    populate_resources(objects, pdf);
    populate_assessmentSum(objects, pdf);
    populate_staff(objects, pdf);

    // Load buttons
    for(var i=0; i<objects.length; i++){
        // Menu info
        box   = document.createElement("div");
        box.id = "LG_box_" + objects[i].title;
        box.classList.add("generated");

        title = document.createElement("h2");
        title.id = "LG_title_" + objects[i].title;
        title.innerHTML = objects[i].title;

        info  = document.createElement("div");
        info.id = "LG_info_" + objects[i].title;
        info.classList.add("infobox");
        info.innerHTML = objects[i].html;

        box.appendChild(title);
        box.appendChild(info);
        document.getElementById("main_body").appendChild(box);

        // Button for menu
        title  = document.createElement("p");
        title.innerHTML = objects[i].title;

        button = document.createElement("div");
        button.id = "LG_button_" + objects[i].title;
        button.classList.add("button");
        button.classList.add("generated");
        button.classList.add("selected");
        button.appendChild(title);
        button.setAttribute("onclick", "event_display(this);")
        button.setAttribute("onwheel", "event_copy(this);")
        document.getElementById("button_container").appendChild(button);
    }
}

function event_display(button){
    var target = document.getElementById("LG_box_"+button.id.split("_")[2]);

    if(target.style.display == "none"){
        target.style.display = "block";
        button.classList.add("selected");
    }else{
        target.style.display = "none";
        button.classList.remove("selected");
    }
}

function event_copy(button){
    // Unhide
    var info = document.getElementById("LG_info_"+button.id.split("_")[2]);
    var title = document.getElementById("LG_title_"+button.id.split("_")[2]);

    // Select
    window.getSelection().selectAllChildren(info);

    // Copy
    copyStringToClipboard(remove_spaces(info.innerHTML));

    // Display a copy notification
    $.growl({title:"Copy Success",
             message: "Copied html of '" + title.innerHTML + "' to clipboard."
    });
}

function populate_welcome(objs, pdf){
    // Add site name
    var found;
    var html = "<p>Welcome to ";
    if("unit_name" in pdf && pdf.unit_name){
        html += pdf.unit_name;
    }else{
        html += "_______Site_Name_______";
    }
    html += ".</p>";

    // Add UC Name
    html += "<p>I am ";

    found = false;
    if("coordinators" in pdf){
        for(var i=0; i<pdf.coordinators.length; i++){
            console.log(pdf.coordinators[i].title, pdf.coordinators[i].Name);
            if(pdf.coordinators[i].title === "Unit Coordinator" && pdf.coordinators[i].Name){
                found = true;
                html += pdf.coordinators[i].Name;
                break;
            }
        }
    }
    if(!found){
        html += "_______UC_Name_______";
    }
    html += ", <a href=\"#teaching-staff\">Unit Coordinator</a>. ";

    // Add unit introduction
    if("welcome" in pdf && pdf.welcome){
        html += pdf.welcome;
    }else{
        html += "This unit introduces students to a set of theories and strategies for exploring _______ \
                and the way _______ shape and inform the way we _______ and _______. Grounded in \
                contexts key to _______ practice, the unit explores what it means to be _______, the \
                difference between newer and older _______, and the way the _______ is re-making _______ \
                practice.</p><p>Students will complete a range of _______ that aim to build understanding \
                of the _______ while further developing _______ and _______ skills.";
    }
    html += "</p>";

    // Add consisant ending text
    html += "<p>I wish you all luck and a successful completion of this unit. You can find out more \
             about me and our teaching team, refer to <strong><a href=\"#teaching-staff\">Teaching \
             Staff</a></strong> section.</p><p>Please review the <strong><a href=\"#unit-learning-outcomes\">\
             Unit Learning Outcomes</a></strong> below and then proceed to the <strong>\
             <a href=\"#getting-started\">Getting Started</a></strong> section.</p>";

    var obj = {
        title: "Welcome",
        html: html
    };
    objs.push(obj);
}

function populate_ULOs(objs, pdf){
    var html = "<ol>";

    if("ULOs" in pdf && pdf.ULOs){
        for(var i=0; i<pdf.ULOs.length; i++){
            html += "<li>" + pdf.ULOs[i] + "</li>";
        }
    }else{
        html += "<li>Demonstrate _______ skills.</li>\
                 <li>Apply a range of theories of _______ and _______ uses.</li>\
                 <li>Employ a variety of _______ and _______ of _______.</li>\
                 <li>Engage in a _______.</li>\
                 <li>Demonstrate an ability to _______ the workings of _______ within _______.</li>";
    }
    html += "</ol>";

    var obj = {
        title: "Unit Learning Outcomes",
        html: html
    };
    objs.push(obj);
}

function populate_resources(objs, pdf){
    html = "<h5>Textbook(s)</h5><ul>";

    // Textbooks
    if("textbooks" in pdf && pdf.textbooks){
        for(var i=0; i<pdf.textbooks.length; i++){
            // TODO: <em> tags around title?
            html += "<li>" + pdf.textbooks[i] + "</li>";
        }
    }else{
        html += "<li>No prescribed textbook</li>";
    }

    html += "</ul><h5>Key Resources</h5><ul>";

    // Equipment
    if("equipment" in pdf && pdf.equipment){
        for(var i=0; i<pdf.equipment.length; i++){
            html += "<li>" + pdf.equipment[i] + "</li>";
        }
    }else{
        html += "<li>_______Resource_1_______</li>\
        <li>_______eg_Lab_coat_______</li>";
    }

    // Static text
    html += "</ul><h5>Student Forms</h5>\
            <p>Common documents such as Assignment Cover Sheet, Request for \
            Extension, Special Consideration and Review of Grade can be downloaded \
            from <a href=\"https://www.westernsydney.edu.au/currentstudents/current_students/forms\" \
            title=\"Student Forms - Western Sydney University\" target=\"_blank\">Student Forms</a>.</p>";


    // Push
    var obj = {
        title: "Essential Resources",
        html: html
    };
    objs.push(obj);
}

function populate_assessmentSum(objs, pdf){
    var html = "<table style=\"width: 100%;\" border=\"0\"><tbody>\
                <tr><th>Title</th><th>Type</th><th>Weighting</th><th>Due<em><br /></em></th></tr>";

    if("assSum" in pdf && pdf.assSum){
        for(var i=0; i<pdf.assSum.length; i++){
            html += "<tr>" +
                    "<td>Assessment " + (i+1).toString() + ": " + pdf.assSum[i].text + "</td>" +
                    "<td>" + pdf.assSum[i].type + "</td>" +
                    "<td>" + pdf.assSum[i].weight + "%</td>" +
                    "<td> </td></tr>";
        }
    }else{
        html += "<tr>\
                <td>Assessment 2: Name_of_assessment</td>\
                <td>Essay</td>\
                <td>20%</td>\
                <td> </td>\
                </tr>\
                <tr>\
                <td>Assessment 3: Name_of_assessment</td>\
                <td>Essay</td>\
                <td>20%</td>\
                <td> </td>\
                </tr>\
                <tr>\
                <td>Assessment 4: Name_of_assessment</td>\
                <td>Exam</td>\
                <td>50%</td>\
                <td> </td>\
                </tr>";
    }

    html += "</tbody>\
            </table>\
            <p></p>\
            <p>Western Sydney University uses a variety of online and in-class assessment processes which may utilise plagiarism detection software.</p>\
            <p>Refer to the <strong><a href=\"#learning-guide\">Learning Guide</a></strong> for assessment details.</p>";

    var obj = {
        title: "Assessment Summary",
        html: html
    };
    objs.push(obj);
}

function populate_staff(objs, pdf){
    var populated = false;
    var html = "";
    var temp, temp2;

    if("coordinators" in pdf){
        for(var i=0; i<pdf.coordinators.length; i++){
            populated = true;

            // Title
            if(pdf.coordinators[i].title === undefined || !pdf.coordinators[i].title){
                continue;
            }
            html += "<h4>" + pdf.coordinators[i].title + "</h4>";

            // Name
            temp = "_______Name_______"
            if(pdf.coordinators[i].Name){
                temp = pdf.coordinators[i].Name;
            }
            html += "<h5>" + pdf.coordinators[i].Name + "</h5>";
            html += "<ul style=\"list-style-type: disc;\">"

            // Email
            temp = "email@westernsydney.edu.au";
            if(pdf.coordinators[i].Email){
                temp = pdf.coordinators[i].Email.toLowerCase();
                while(temp.includes(",")){
                    temp = temp.replace(",", ".");
                }
            }
            html += "<li>E: <a href=\"mailto:" + temp + "\" title=\"Email\" target=\"_blank\"\
                     >" + temp + "</a></li>";

            // Phone
            temp == "_______phone_______";
            if(pdf.coordinators[i].Phone){
                temp = pdf.coordinators[i].Phone;
                temp2 = "";
                for(var c=0; c<temp.length; c++){
                    if(temp[c].match(/([0-9]|\(|\))/g)){
                        temp2 += temp[c]
                    }
                }
                temp = temp2;
            }
            html += "<li>P: " + temp + "</li>";

            // Staff Profile
            temp = "https://www.westernsydney.edu.au/staff_profiles";
            if(pdf.coordinators[i].Name){
                temp = pdf.coordinators[i].Name.toLowerCase();
                temp = temp.replace(/\s/g,'_').replace(/[^a-z_]/g, '');
                temp = temp.replace("dr", "doctor");
                temp = temp.replace("assoc", "associate");
                temp = temp.replace("prof", "professor")
                temp = "https://www.westernsydney.edu.au/staff_profiles/WSU/" + temp;
            }
            html += "<li>Profile: <a href=\""+ temp + "\" title=\"Staff Profile\" target=\"_blank\">View staff profile</a></li>";

            // Consultation
            html += "<li>Consultation (by appointment):<ul>";
            temp = "<li>Kingswood Campus: Building _______, Level _______, each _______ between _______:00_______m-_______:00_______m</li>\
                    <li>Parramatta South Campus: Building _______, Level _______, each _______ between _______:00_______m-_______:00_______m</li>";

            if(pdf["Consultation Arrangement"]){
                temp = "<li>" + pdf["Consultation Arrangement"] + "<li>";
            }

            html += "</ul></li></ul>";
        }
    }

    // Tutors and static text
    html += "<h4>Tutors</h4><ul>\
            <li>Dr Jane Smith - email@westernsydney.edu.au</li>\
            <li>Dr John Citizen - email@westernsydney.edu.au</li>\
            <li>Ms Kim Doe - email@westernsydney.edu.au</li>\
            </ul><h4>Email Protocols</h4>\
            <p>All email communications must be sent from your student email account. \
            Emails must contain your full name, student number, the unit name, semester, \
            and clearly state the purpose of the message in a professional standard.</p>\
            <h4>Have a question?</h4>\
            <p>The main channels for communication supported in this unit are:</p>\
            <ul>\
            <li>Post your question to the Discussion Board or Facebook group</li>\
            <li>Ask your questions during question time in your tutorial</li>\
            <li>Request a on-campus or online consultation with the Unit Coordinator or tutor</li>\
            <li>Email your tutor. The expected response time is within 72-hours.</li>\
            </ul>";

    var obj = {
        title: "Teaching Staff",
        html: html
    };
    objs.push(obj);
}
