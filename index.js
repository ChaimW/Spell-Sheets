var allDefaultAbilities;    //map[String: DefaultAbility]
var allDefaultClasses;  //map[String: DefaultClass]
var allMaterials = [
    "Arrow, Gray (Phase)",
    "Arrow, Green (Poison)",
    "Arrow, Purple (Suppression)",
    "Arrow, Red (Destruction)",
    "Arrow, Yellow (Pinning)",
    "Magic Ball, Black",
    "Magic Ball, Blue",
    "Magic Ball, Brown",
    "Magic Ball, Gray",
    "Magic Ball, Green",
    "Magic Ball, Purple",
    "Magic Ball, Red",
    "Magic Ball, White",
    "Magic Ball, Yellow",
    "Strip, Red",
    "Strip, White",
    "Strip, Yellow"
];

var currentPlayer;

function initAbilities(abilitiesJSON) {
    allDefaultAbilities = new Map();
    allDefaultAbilities.set("Look the Part", new DefaultAbility("Look the Part", "&#8210;", "&#8210;", "&#8210;"));
    var uniqueName, jsonEntry;
    for (uniqueName in abilitiesJSON) {
        jsonEntry = abilitiesJSON[uniqueName];
        allDefaultAbilities.set(
            jsonEntry["name"],
            new DefaultAbility(
                jsonEntry["name"],
                jsonEntry["t"],
                jsonEntry["s"],
                jsonEntry["r"],
                jsonEntry["m"],
                jsonEntry["i"],
                jsonEntry["e"],
                jsonEntry["l"],
                jsonEntry["n"]
            )
        );
    }
}

function initClasses(classesJSON) {
    allDefaultClasses = new Map();
    var defaultClass, curClass, abilityObj, levelIndex;
    for (defaultClass in classesJSON) {
        jsonEntry = classesJSON[defaultClass];
        curClass = new DefaultClass(jsonEntry["name"], false);
        if (jsonEntry["magic-user"] != undefined) {
            curClass.isMagicUser = jsonEntry["magic-user"];
        }
        for (levelIndex = 0; levelIndex < 7 && levelIndex < jsonEntry["levels"].length; levelIndex++) {
            if (jsonEntry["levels"][levelIndex]["points"] != undefined) {
                curClass.levels[levelIndex].points = jsonEntry["levels"][levelIndex]["points"];
            }
            jsonEntry["levels"][levelIndex]["abilityEntries"].forEach(function(abilityObj) {
                curClass.addAbilityEntry(
                    levelIndex,
                    abilityObj["abilityName"],
                    abilityObj["abilityName"],
                    abilityObj["cost"],
                    abilityObj["max"],
                    abilityObj["count"],
                    abilityObj["per"],
                    abilityObj["charge"]
                );
            });
        }
        if (curClass.isMagicUser) {
            curClass.levels[6].points = 1;
        }
        curClass.addAbilityEntry(6, "*Look the Part*", "Look the Part", 0, 1, 1, "&#8210;", 0);
        allDefaultClasses.set(jsonEntry["name"], curClass);
    }
}

function unlock() {
    document.getElementById("refresh-button").disabled = false;
    document.getElementById("class-name").innerHTML = "Select Class and Level";
}

function loadClass() {
    currentPlayer = new Player(
        document.getElementById("select-className").value,
        document.getElementById("select-level").selectedIndex
    );
    update();
}

var unimplementedAbilityNames = ["Avatar of Nature", "Battlemage", "Dervish", "Evoker", "Experienced", "Legend", "Necromancer", "Priest", "Ranger", "Sniper", "Summoner", "Warder", "Warlock"]
function update() {
    //console.clear();
    console.dir(allDefaultClasses);
    currentPlayer.updatePoints();
    console.dir(currentPlayer);
    console.log(formatPointDistributionOfPlayer(currentPlayer));
    
//update Current Abilities
    document.getElementById("current-abilities").innerHTML = "";
    var currentAbilities, curNewAbilityEntry, currentAbilityText;
    currentAbilities = new Map();
    currentPlayer.allAvailableAbilityEntries.forEach(function(abilityEntry) {
        if (currentPlayer.getCountOfAbilityEntry(abilityEntry) > 0) {
            if (currentAbilities.has(abilityEntry.ability.name)) {
                curNewAbilityEntry = joinAbilityEntries(currentAbilities.get(abilityEntry.ability.name), abilityEntry);
                curNewAbilityEntry.count = currentAbilities.get(abilityEntry.ability.name).count + (currentPlayer.getCountOfAbilityEntry(abilityEntry) * abilityEntry.count);
                currentAbilities.set(
                    abilityEntry.ability.name,
                    curNewAbilityEntry
                );
            } else {
                currentAbilities.set(
                    abilityEntry.ability.name,
                    new AbilityEntry(
                        abilityEntry.ability.name,
                        abilityEntry.ability.name,
                        abilityEntry.cost,
                        abilityEntry.max,
                        currentPlayer.getCountOfAbilityEntry(abilityEntry) * abilityEntry.count,
                        abilityEntry.per,
                        abilityEntry.charge
                    )
                );
            }
        }
    });
    var currentAbilityText;
    currentAbilities.forEach(function(newAbilityEntry, abilityEntryName) {
        if (newAbilityEntry.name == "Look the Part") {
            document.getElementById("current-abilities").innerHTML = "<li>*Look the Part*</li>" + document.getElementById("current-abilities").innerHTML;
        } else {
            currentAbilityText = "<li>";
            currentAbilityText += newAbilityEntry.name;
            if (newAbilityEntry.per != "&#8210;") {
                currentAbilityText += " (";
                currentAbilityText += newAbilityEntry.shortFrequency();
                if (newAbilityEntry.ability.range != "&#8210;") {
                    currentAbilityText += "@" + newAbilityEntry.ability.range;
                }
                currentAbilityText += ")";
            }
            currentAbilityText += "</li>";
            document.getElementById("current-abilities").innerHTML += currentAbilityText;
        }
    });
    
//update Current Equipment
    document.getElementById("current-equipment").innerHTML = "";
    var currentEquipmentCount, currentEquipmentText;
    allMaterials.forEach(function(curEquipment) {
        currentEquipmentCount = 0;
        currentAbilities.forEach(function(newAbilityEntry) {
            if (newAbilityEntry.ability.materials.has(curEquipment)) {
                currentEquipmentCount += newAbilityEntry.ability.materials.get(curEquipment) * newAbilityEntry.count;
            }
        });
        if (currentEquipmentCount > 0) {
            currentEquipmentText = "";
            currentEquipmentText += "<li>";
            currentEquipmentText += curEquipment;
            if (currentEquipmentCount > 1) {
                currentEquipmentText += " (x";
                currentEquipmentText += currentEquipmentCount;
                currentEquipmentText += ")"
            }
            currentEquipmentText += "</li>";
            document.getElementById("current-equipment").innerHTML += currentEquipmentText;
        }
    });
    
//update Class Name
    document.getElementById("class-name").innerHTML = currentPlayer.playerClass.name + ", level " + (currentPlayer.level + 1);
//update Class List
    var classList, bod;
    toArray(document.getElementById("class-list").getElementsByTagName("tbody")).forEach(function(body) {
        document.getElementById("class-list").removeChild(body);
    });
    
    currentPlayer.playerClass.levels.forEach(function(curLevel, curLevelIndex) {
        bod = document.createElement("tbody");
        classList = "<tr><td colspan=\"9\"><b>" + curLevel.levelName;
        if (curLevel.points > 0 && currentPlayer.hasLevelIndex(curLevelIndex)) {
            classList += ": </b>" + currentPlayer.getPointsRemainingAtLevelIndex(curLevelIndex) + "/" + curLevel.points;
        } else {
            classList += "</b>";
        }
        classList += "</td></tr>";
        curLevel.abilityEntries.forEach(function(abilityEntry) {
            classList += "<tr><td class=\"tooltip\">&nbsp;&nbsp;" + abilityEntry.name;
            classList += "<span class=\"tooltiptext\">" + abilityEntry.ability.description + "</span>";
            classList += "</td><td id=\"cost " + abilityEntry.name + " @ " + curLevelIndex + "\">" + abilityEntry.cost + "</td><td id=\"max " + abilityEntry.name + " @ " + curLevelIndex + "\">";
            if (abilityEntry.max == -1) {
                classList += "&#8210;";
            } else {
                classList += abilityEntry.max;
            }
            classList += "</td><td>";
            if (abilityEntry.per == undefined) {
                classList += "&#8210;";
            } else {
                classList += abilityEntry.longFrequency();
            }
            classList += "</td><td id=\"type " + abilityEntry.name + " @ " + curLevelIndex + "\">" + abilityEntry.ability.type + "</td><td>" + abilityEntry.ability.school + "</td><td>" + abilityEntry.ability.range + "</td><td>";
            if (abilityEntry.ability.name == "Look the Part") {
                if (currentPlayer.hasLookThePart) {
                    classList += "<button type=\"button\" id=\"rem " + abilityEntry.name + " @ " + curLevelIndex + "\" onclick=\"currentPlayer.hasLookThePart = false; update()\">&#8210;</button>";
                } else {
                    classList += "<button type=\"button\" id=\"rem " + abilityEntry.name + " @ " + curLevelIndex + "\" disabled>&#8210;</button>";
                }
            } else if (currentPlayer.hasLevelIndex(curLevelIndex) && (abilityEntry.cost != 0 || currentPlayer.playerClass.isMagicUser)) {
                if (currentPlayer.getCountOfAbilityEntry(abilityEntry) == 0) {
                    classList += "<button type=\"button\" id=\"rem " + abilityEntry.name + " @ " + curLevelIndex + "\" disabled>&#8210;</button>";
                } else {
                    classList += "<button type=\"button\" id=\"rem " + abilityEntry.name + " @ " + curLevelIndex + "\" onclick=\"currentPlayer.remAbilityEntry('" + abilityEntry.name + "', '" + curLevelIndex + "'); update()\">&#8210;</button>";
                }
            }
            classList += "<span id=\"num " + abilityEntry.name + " @ " + curLevelIndex + "\" style=\"font-family:monospace\">&nbsp;" + formatNumber(currentPlayer.getCountOfAbilityEntry(abilityEntry)) + "&nbsp;</span>";
            if (abilityEntry.ability.name == "Look the Part") {
                if (currentPlayer.hasLookThePart) {
                    classList += "<button type=\"button\" id=\"add " + abilityEntry.name + " @ " + curLevelIndex + "\" disabled>+</button>";
                } else {
                    classList += "<button type=\"button\" id=\"add " + abilityEntry.name + " @ " + curLevelIndex + "\" onclick=\"currentPlayer.hasLookThePart = true; update()\">+</button>";
                }
            } else if (currentPlayer.hasLevelIndex(curLevelIndex) && (abilityEntry.cost != 0 || currentPlayer.playerClass.isMagicUser)) {
                if (unimplementedAbilityNames.indexOf(abilityEntry.ability.name) == -1) {
                    if (currentPlayer.getCostOfAbilityEntry(abilityEntry.name, curLevelIndex) == undefined) {
                        classList += "<button type=\"button\" id=\"add " + abilityEntry.name + " @ " + curLevelIndex + "\" disabled>+</button>";
                    } else {
                        classList += "<button type=\"button\" id=\"add " + abilityEntry.name + " @ " + curLevelIndex + "\" onclick=\"currentPlayer.addAbilityEntry('" + abilityEntry.name + "', '" + curLevelIndex + "'); update()\">+</button>";
                    }
                } else {
                    classList += "<button type=\"button\" id=\"add " + abilityEntry.name + " @ " + curLevelIndex + "\" disabled>?</button>";
                }
            }
            classList += "</td><td>";
            /*
            if (currentPlayer.playerClass.canExpAbilityEntry(abilityEntry, curLevelIndex)) {
                classList += "<button type=\"button\" id=\"exp " + abilityEntry.name + " @ " + curLevelIndex + "\" onclick=\"currentPlayer.expAbilityEntry('" + abilityEntry.name + "','" + curLevelIndex + "'); update()\"></button>";
            }
            */
            classList += "</td></tr>";
        });
        bod.innerHTML = classList;
        document.getElementById("class-list").appendChild(bod);
        
        /*
        curLevel.abilityEntries.forEach(function(abilityEntry) {
            if (currentPlayer.hasLevelIndex(curLevelIndex) && (abilityEntry.cost != 0 || currentPlayer.playerClass.isMagicUser)) {
                if (unimplementedAbilityNames.indexOf(abilityEntry.ability.name) == -1) {
                    if (currentPlayer.playerClass.canExpAbilityEntry(abilityEntry, curLevelIndex)) {
                        document.getElementById("exp " + abilityEntry.name + " @ " + curLevelIndex).style.visibility = "visible";
                        if (currentPlayer.expAbilities.indexOf(abilityEntry) == -1) {
                            document.getElementById("exp " + abilityEntry.name + " @ " + curLevelIndex).disabled = (currentPlayer.expAbilities.length == currentPlayer.getCountOfAbilityName("Experienced"));
                            document.getElementById("exp " + abilityEntry.name + " @ " + curLevelIndex).innerHTML = "+";
                        } else {
                            document.getElementById("exp " + abilityEntry.name + " @ " + curLevelIndex).innerHTML = "&#8210;";
                        }
                    } else {
                        document.getElementById("exp " + abilityEntry.name + " @ " + curLevelIndex).style.visibility = "hidden";
                    }
                }
            }
        });
        */
    });
}

function Player(playerClassName, level) {
    this.playerClass = allDefaultClasses.get(playerClassName);
    this.level = Number(level);
    this.hasLookThePart = false;
    
    this.hasLevelIndex = function Player_hasLevelIndex(levelIndex) {
        return levelIndex <= this.level || (levelIndex == 6 && this.hasLookThePart == true);
    }
    
    this.maxPoints = new Array();
    this.points = new Map();
    this.counts = new Map();
    
    this.allAvailableAbilityEntries = new Array();
    var curAbilityEntry;
    for (var i = 0; i < 7; i++) {
        if (i <= this.level || i == 6) {
            this.maxPoints[i] = this.playerClass.levels[i].points;
            for (var j = 0; j < this.playerClass.levels[i].abilityEntries.length; j++) {
                curAbilityEntry = this.playerClass.levels[i].abilityEntries[j];
                this.allAvailableAbilityEntries.push(curAbilityEntry);
                this.points.set(curAbilityEntry, [0, 0, 0, 0, 0, 0, 0]);
                this.counts.set(curAbilityEntry, 0);
            }
        } else {
            this.maxPoints[i] = 0;
        }
    }
    this.allAvailableAbilityEntries.sort(sortByName);
    
    this.hasAbilityEntry = function Player_hasAbilityEntry(abilityEntry, levelIndex) {
        return this.points.has(abilityEntry) && (levelIndex == undefined || this.playerClass.levels[levelIndex].hasAbilityEntry(abilityEntry));
    };
    
    this.getCountOfAbilityEntry = function Player_getCountOfAbilityEntry(abilityEntry) {
        if (this.hasAbilityEntry(abilityEntry)) {
            if (abilityEntry.ability.name == "Look the Part") {
                return this.hasLookThePart == true;
            }
            var count = this.counts.get(abilityEntry);
            print(abilityEntry + ": " + count + " instances purchased");
            return count;
        } else {
            return 0;
        }
    };
    
    this.getCountOfAbilityName = function Player_getCountOfAbilityName(abilityName) {
        var count = 0;
        for (var abilityEntry in this.allAvailableAbilityEntries) {
            if (abilityEntry.name == abilityName) {
                count += this.getCountOfAbilityEntry(abilityEntry);
            }
        }
        return count;
    };
    
    this.updatePoints = function() {
        for (var i = 0; i < 7; i++) {
            if (i <= this.level || i == 6) {
                for (var j = 0; j < this.playerClass.levels[i].abilityEntries.length; j++) {
                    var abilityEntry = this.playerClass.levels[i].abilityEntries[j];
                    var count = this.getCountOfAbilityEntry(abilityEntry);
                    if (!this.playerClass.isMagicUser && abilityEntry.cost < 1) {
                        count = 1;
                    }
                    this.points.set(abilityEntry, [0, 0, 0, 0, 0, 0, 0]);
                    this.counts.set(abilityEntry, 0);
                    while(this.counts.get(abilityEntry) < count) {
                        if(!this.addAbilityEntry(abilityEntry.name, i)) {
                            count--;
                        }
                    }
                }
            }
        }
    }
    
    this.getCostOfAbilityEntry = function Player_getCostOfAbilityEntry(abilityEntryName, levelIndex) {
        var abilityEntry = this.playerClass.getAbilityEntry(abilityEntryName, levelIndex);
        if (abilityEntry == undefined) {
            return undefined;
        }
        print("getting cost of ability entry " + abilityEntry + " at level index " + levelIndex);
        indent(true);
        print("found level " + this.playerClass.levels[levelIndex].levelName);
        print("comparing ability count " + this.getCountOfAbilityEntry(abilityEntry) + " to maximum count " + abilityEntry.max);
        if (abilityEntry.max == -1 || this.getCountOfAbilityEntry(abilityEntry) < abilityEntry.max) {
            print("purchases remaining");
            var pointsSpent = [0, 0, 0, 0, 0, 0, 0];
            if (levelIndex == 6) {
                if (abilityEntry.ability.name == "Look the Part") {
                    console.groupEnd();
                    print("everyone can look the part");
                    return pointsSpent;
                } else if (!this.hasLookThePart) {
                    console.groupEnd();
                    print("player does not look the part");
                    return undefined;
                }
            }
            if (this.playerClass.isMagicUser) {
                print("player is magic-user");
                var i = levelIndex;
                var pointsRemainingAtLevel = this.getPointsRemainingAtLevelIndex(i);
                while (sum(pointsSpent) < abilityEntry.cost) {
                    if (i == 7) {
                        console.groupEnd();
                        print("found HIGH cost: " + pointsSpent);
                        return undefined;
                    } else if (pointsSpent[i] < pointsRemainingAtLevel) {
                        pointsSpent[i]++;
                    } else {
                        i++;
                        pointsRemainingAtLevel = this.getPointsRemainingAtLevelIndex(i);
                    }
                }
                console.groupEnd();
                print("found LOW cost: " + pointsSpent);
                return pointsSpent;
            } else {
                print("player is martial");
                pointsSpent[levelIndex] += abilityEntry.cost;
                print("found cost: " + pointsSpent);
                print("comparing points spent " + abilityEntry.cost + " to points remaining " + this.getPointsRemainingAtLevelIndex(levelIndex));
                if (abilityEntry.cost <= this.getPointsRemainingAtLevelIndex(levelIndex)) {
                    console.groupEnd();
                    print("points remaining: " + pointsSpent);
                    return pointsSpent;
                } else {
                    console.groupEnd();
                    print("no points remaining: " + pointsSpent);
                    return undefined;
                }
            }
        } else {
            console.groupEnd();
            print("no purchases remaining");
            return undefined;
        }
    };
    
    this.getPointsRemainingAtLevelIndex = function Player_getPointsRemainingAtLevelIndex(levelIndex) {
        var pointsRemaining = this.maxPoints[levelIndex];
        this.points.forEach(function(pointsSpent) {
            pointsRemaining -= pointsSpent[levelIndex];
        });
        if (levelIndex == 6 && this.playerClass.isMagicUser && !this.hasLookThePart) {
            pointsRemaining--;
        }
        print(pointsRemaining + " points remaining at level index " + levelIndex);
        return pointsRemaining;
    };

    this.addAbilityEntry = function Player_addAbilityEntry(abilityEntryName, levelIndex) {
        var abilityEntry = this.playerClass.getAbilityEntry(abilityEntryName, levelIndex);
        if (abilityEntry == undefined) {
            return false;
        }
        print("add " + abilityEntryName + " at level index " + levelIndex);
        var costOfAbilityEntry = this.getCostOfAbilityEntry(abilityEntryName, levelIndex);
        if (costOfAbilityEntry == undefined) {
            return false;
        } else {
            for (var i = 0; i < 7; i++) {
                this.points.get(abilityEntry)[i] += costOfAbilityEntry[i];
            }
            print("new points: " + this.points.get(abilityEntry));
            this.counts.set(abilityEntry, this.counts.get(abilityEntry) + 1);
            return true;
        }
    };

    this.remAbilityEntry = function Player_remAbilityEntry(abilityEntryName, levelIndex) {
        var abilityEntry = this.playerClass.getAbilityEntry(abilityEntryName, levelIndex);
        if (abilityEntry == undefined) {
            return false;
        }
        print("rem " + abilityEntry.name);
        if (this.hasAbilityEntry(abilityEntry)) {
            var pointsGained = 0;
            for (var i = 6; i >= levelIndex ; i--) {
                while (pointsGained < abilityEntry.cost && this.points.get(abilityEntry)[i] > 0) {
                    this.points.get(abilityEntry)[i]--;
                    pointsGained++;
                }
            }
            print(this.points.get(abilityEntry));
            this.counts.set(abilityEntry, this.counts.get(abilityEntry) - 1);
            return true;
        } else {
            return false;
        }
    };
    
    this.expAbilityEntry = function Player_expAbilityEntry(abilityName, levelIndex) {
        return;
        var abilityEntry = this.playerClass.getAbilityEntryByAbilityName(abilityName, levelIndex);
        if (abilityEntry == undefined) {
            return false;
        }
        if (this.playerClass.canExpAbilityEntry(abilityEntry, levelIndex) && this.hasAbilityEntry(abilityEntry, levelIndex)) {
            var abilityEntryIndex = this.allAvailableAbilityEntries.indexOf(abilityEntry);
            this.allAvailableAbilityEntries[abilityEntryIndex] == new AbilityEntry(
                abilityEntry.name,
                abilityEntry.cost,
                abilityEntry.max,
                abilityEntry.count,
                abilityEntry.per,
                abilityEntry.refresh
            );
            if (abilityEntry.per == "Life") {
                this.allAvailableAbilityEntries[abilityEntryIndex].charge = 5;
            } else {
                this.allAvailableAbilityEntries[abilityEntryIndex].charge = 10;
            }
        }
    }
}

function DefaultClass(name, isMagicUser) {
    this.name = String(name);
    this.isMagicUser = Boolean(isMagicUser);
    
    this.levels = [
        {levelName:"1st Level", points:0, abilityEntries:[]},
        {levelName:"2nd Level", points:0, abilityEntries:[]},
        {levelName:"3rd Level", points:0, abilityEntries:[]},
        {levelName:"4th Level", points:0, abilityEntries:[]},
        {levelName:"5th Level", points:0, abilityEntries:[]},
        {levelName:"6th Level", points:0, abilityEntries:[]},
        {levelName:"Look the Part", points:0, abilityEntries:[]}
    ];
    
    this.indexOfAbilityEntry = function DefaultClass_indexOfAbilityEntry(abilityEntryName, levelIndex) {
        for (var i = 0; i < this.levels[levelIndex].abilityEntries.length; i++) {
            if (this.levels[levelIndex].abilityEntries[i].name == abilityEntryName) {
                return i;
            }
        }
        return -1;
    };
    
    this.indexOfAbilityName = function DefaultClass_indexOfAbilityName(abilityName, levelIndex) {
        for (var i = 0; i < this.levels[levelIndex].abilityEntries.length; i++) {
            if (this.levels[levelIndex].abilityEntries[i].name == abilityName) {
                return i;
            }
        }
        return -1;
    };
    
    this.hasAbilityEntry = function DefaultClass_hasAbilityEntry(abilityEntry, levelIndex) {
        return (this.levels[levelIndex].abilityEntries.indexOf(abilityEntry) != -1);
    };
    
    this.addAbilityEntry = function DefaultClass_addAbilityEntry(levelIndex, name, abilityName, cost, max, count, per, charge, tags) {
        if (this.indexOfAbilityName(abilityName, levelIndex) != -1) {
            print("cannot add ability entry " + name + " at level index " + levelIndex);
        } else {
            var abilityEntry = new AbilityEntry(name, abilityName, 0, 1, 1, "&#8210;", 0, []);
            if (name == undefined) {
                abilityEntry.name = abilityName;
            }
            if (cost != undefined) {
                abilityEntry.cost = Number(cost);
            }
            if (max != undefined) {
                abilityEntry.max = Number(max);
            } else if (this.isMagicUser && cost > 0) {
                abilityEntry.max = -1;
            }
            if (count != undefined) {
                abilityEntry.count = Number(count);
            }
            if (per != undefined) {
                abilityEntry.per = String(per);
            }
            if (charge != undefined) {
                abilityEntry.charge = Number(charge);
            }
            if (tags != undefined) {
                abilityEntry.tags = tags;
            }
            this.levels[levelIndex].abilityEntries.unshift(abilityEntry);
            this.levels[levelIndex].abilityEntries.sort(sortByName);
        }
    };

    this.getAbilityEntry = function DefaultClass_getAbilityEntry(abilityEntryName, levelIndex) {
        if (levelIndex < 0 || levelIndex > 6) {
            print(abilityName + ": level index " + levelIndex + " does not exist");
            return undefined;
        } else {
            var abilityEntryIndex = this.indexOfAbilityEntry(abilityEntryName, levelIndex);
            if (abilityEntryIndex != -1) {
                return this.levels[levelIndex].abilityEntries[abilityEntryIndex];
            } else {
                print(abilityName + ": does not exist at level " + this.levels[levelIndex].name);
                return undefined;
            }
        }
    };
    
    this.canExpAbilityEntry = function DefaultClass_canExpAbilityEntry(abilityEntry, levelIndex) {
        return (
            levelIndex < 4 &&
            this.hasAbilityEntry(abilityEntry, levelIndex) &&
            abilityEntry.ability.type == "Verbal" &&
            (
                abilityEntry.per == "Life" ||
                abilityEntry.per == "Refresh"
            ) &&
            abilityEntry.charge == 0
        )
    }
}

function AbilityEntry(name, abilityName, cost, max, count, per, charge, tags) {
    this.name = String(name);
    this.ability = allDefaultAbilities.get(abilityName);
    this.cost = Number(cost);
    this.max = Number(max);
    this.count = Number(count);
    this.per = String(per);
    this.charge = Number(charge);
    this.tags = tags;
    
    this.longFrequency = function() {
        if (this.per == "&#8210;") {
            return "&#8210;";
        } else if (this.per == "Unlimited") {
            return "Unlimited";
        } else if (this.per == "Ball") {
            if (this.count == 1) {
                return "1 Ball/Unlimited";
            } else {
                return this.count + " Balls/Unlimited";
            }
        } else if (this.per == "Arrow") {
            if (this.count == 1) {
                return "1 Arrow/Unlimited";
            } else {
                return this.count + " Arrows/Unlimited";
            }
        } else {
            if (this.charge > 0) {
                return this.count + "/" + this.per + " Charge x" + this.charge;
            } else {
                return this.count + "/" + this.per;
            }
        }
    }
    
    this.shortFrequency = function() {
        if (this.per == "&#8210;") {
            return "&#8210;";
        } else if (this.per == "Unlimited") {
            return "U";
        } else if (this.per == "Ball") {
            return "B/U";
        } else if (this.per == "Arrow") {
            return "A/U";
        } else {
            if (this.charge > 0) {
                return this.count + "/" + this.per.charAt(0) + "x" + this.charge;
            } else {
                return this.count + "/" + this.per.charAt(0);
            }
        }
    }
    
    this.toString = function() {
        return this.name;
    }
}

function joinAbilityEntries(firstAbilityEntry, secondAbilityEntry) {
    if (firstAbilityEntry.ability == secondAbilityEntry.ability) {
        var returnAbilityEntry = new AbilityEntry(
            firstAbilityEntry.ability.name,
            firstAbilityEntry.ability.name,
            0,
            1,
            Math.max(firstAbilityEntry.count, secondAbilityEntry.count),
            "&#8210;",
            0
        );
        if (firstAbilityEntry.per == "Unlimited" || secondAbilityEntry.per == "Unlimited") {
            returnAbilityEntry.per = "Unlimited";
        } else if (firstAbilityEntry.per == "Ball" || secondAbilityEntry.per == "Ball"){
            returnAbilityEntry.per = "Ball";
        } else {
            if (firstAbilityEntry.per == "Arrow" || secondAbilityEntry.per == "Arrow"){
                returnAbilityEntry.per = "Arrow";
            } else if (firstAbilityEntry.per == "Life" || secondAbilityEntry.per == "Life") {
                returnAbilityEntry.per = "Life";
            } else if (firstAbilityEntry.per == "Refresh" || secondAbilityEntry.per == "Refresh") {
                returnAbilityEntry.per = "Refresh";
            }
            if (firstAbilityEntry.charge > 0 && secondAbilityEntry.charge > 0) {
                returnAbilityEntry.charge = Math.min(firstAbilityEntry.charge, secondAbilityEntry.charge);
            } else {
                returnAbilityEntry.charge = Math.max(firstAbilityEntry.charge, secondAbilityEntry.charge);
            }
        }
        return returnAbilityEntry;
    }
}

function DefaultAbility(name, type, school, range, newEquipment, incantation, effect, limitations, notes) {
    this.name = String(name);
    if (this.name == "Look the Part") {
        this.description = "<b>Look the Part:</b> This is an extra Ability that is available to a player only if they actively role-play or portray their class. Examples would be acting consistently in character in battlegames, having good class-specific garb, and meaningfully  contributing to the atmosphere of the game. This ability need not meet a cookie-cutter definition of the class; any dedicated behavior consistent with a backstory can work. Barbarian, for example, could be played as a refined Samurai rather than a raging viking and still qualify for the bonus. Look The Part abilities are available at first level and are in addition to all other class abilities. Example: A player has a Look The Part ability of Scavenge 1/Life and a normal class ability of Scavenge 1/Life would have Scavenge 2/life. Who qualifies for Look The Part is game-by-game bonus awarded by the group monarch or joint decision of the game reeve and the guildmaster for the class.";
    } else {
        this.description = "<div style=\"font-size:20px;font-weight:bold;font-variant:small-caps;\">" + this.name + "</div>";
    }
    
    this.type = String(type);
    this.description += "<b>T:</b> " + this.type + "<br>";
    
    if (school == undefined) {
        this.school = "&#8210;";
    } else {
        this.school = String(school);
        this.description += "<b>S:</b> " + this.school + "<br>";
    }
    
    if (range == undefined) {
        this.range = "&#8210;";
    } else {
        this.range = String(range);
        this.description += "<b>R:</b> " + this.range + "<br>";
    }
    
    this.materials = new Map();
    if (newEquipment != undefined && newEquipment.length > 0 && newEquipment != ["No strip required"]) {
        newEquipment.sort();
        for (var curEquipmentIndex in newEquipment) {
            if (this.materials.has(newEquipment[curEquipmentIndex])) {
                this.materials.set(newEquipment[curEquipmentIndex], this.materials.get(newEquipment[curEquipmentIndex]) + 1);
            } else {
                this.materials.set(newEquipment[curEquipmentIndex], 1);
            }
        }
    }
    if (this.materials.size > 0) {
        this.description += "<b>M:</b> ";
        for (var i = 0; i < allMaterials.length; i++) {
            if (this.materials.has(allMaterials[i])) {
                this.description += allMaterials[i];
                if (this.materials.get(allMaterials[i]) > 1) {
                    this.description += " x" + this.materials.get(allMaterials[i]);
                }
                this.description += ", ";
            }
        }
        this.description = this.description.substr(0, this.description.length - 2);
        this.description += "<br>";
    }
    
    if (incantation != undefined) {
        this.incantation = String(incantation);
        this.description += "<b>I:</b> " + this.incantation + "<br>";
    }
    
    if (effect != undefined) {
        this.effect = String(effect);
        this.description += "<b>E:</b> " + this.effect + "<br>";
    }
    
    if (limitations != undefined) {
        this.limitations = String(limitations);
        this.description += "<b>L:</b> " + this.limitations + "<br>";
    }
    
    if (notes != undefined) {
        this.notes = String(notes);
        this.description += "<b>N:</b> " + this.notes + "<br>";
    }
}

function toArray(DOMNodeList) {
  var returnArray = [];
  for (var i = 0; i < DOMNodeList.length; i++) { 
    returnArray[i] = DOMNodeList.item(i);
  }
  return returnArray;
}

function indexOfObjWithName(value, index, arrayObj) {
    return (arrayObj[index].name == value);
}

function sortByName(firstObj, secondObj) {
    if (firstObj.name > secondObj.name) {
        return 1;
    } else if (firstObj.name < secondObj.name) {
        return -1;
    } else {
        return 0;
    }
}

function sum(arrayObj) {
    return arrayObj.reduce(
        function(a, b) {
            return a + b;
        },
        0
    );
}

var outputMessagesFrom = ["update", "!Player_getCostOfAbilityEntry", "!Player_getPointsRemainingAtLevelIndex", "!Player_getPointsSpentOnAbilityEntry", "!Player_addAbilityEntry", "DefaultClass_addAbilityEntry"];

function doBeVerbose() {
    var returnVal = (outputMessagesFrom.indexOf(doBeVerbose.caller.caller.name) != -1);
    /*
    if (returnVal) {
        console.trace();
    }
    */
    return returnVal;
}

function print(message, isWarning) {
    if (doBeVerbose()) {
        if (isWarning) {
            console.warn(message);
        } else {
            console.log(message);
        }
    }
}

function printObj(obj) {
    if (doBeVerbose()) {
        console.dir(obj);
    }
}

function indent(isCollapsed) {
    if (doBeVerbose()) {
        if (isCollapsed) {
            console.groupCollapsed();
        } else {
            console.group();
        }
    }
}

function formatPointDistributionOfPlayer(playerObj) {
    var text = "";
    text += playerObj.playerClass.name + ", " + playerObj.playerClass.levels[playerObj.level].levelName + "\n";
    text += "                               0  1  2  3  4  5  6\n";
    text += formatPointArray(
        "MAX",
        playerObj.maxPoints,
        "\n"
    );
    playerObj.points.forEach(function(points, abilityEntry) {
        text += formatPointArray(
            abilityEntry.name,
            playerObj.points.get(abilityEntry),
            " : " + formatNumber(playerObj.getCountOfAbilityEntry(abilityEntry)).substr(-2) + "\n"
        );
    });
    text += formatPointArray(
        "LEFT",
        playerObj.playerClass.levels.map(function(level, levelIndex) {
            return playerObj.getPointsRemainingAtLevelIndex(levelIndex);
        }),
        "\n"
    );
    return text;
}

function formatNumber(number) {
    var text = "";
    if(number < 10) {
        text += "&nbsp;";
    }
    if(number < 0) {
        text += "-";
    } else {
        text += " ";
    }
    text += Math.abs(number);
    return text;
}

function formatPointArray(preLabel, pointArray, postLabel) {
    var text = "";
    text += preLabel;
    while(text.substring(text.lastIndexOf("\n")).length < 29) {
        text += " ";
    }
    pointArray.forEach(function(point) {
        text += " ";
        text += formatNumber(point).substr(-2);
    });
    if (postLabel != undefined) {
        text += postLabel;
    }
    return text;
}

function preInit() {
    var request = new XMLHttpRequest();
    request.open('GET', "https://jkat718.github.io/docs/Spell-Sheets-By-Gor/abilities.json", true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            print("Connected...");
            if (request.status >= 200 && request.status < 400){
                if (allDefaultAbilities == undefined) {
                    initAbilities(JSON.parse(request.responseText));
                    request.open('GET', "https://jkat718.github.io/docs/Spell-Sheets-By-Gor/classes.json", true);
                    request.send();
                } else {
                    initClasses(JSON.parse(request.responseText));
                    unlock();
                }
            } else {
                print("Server reached, returned error code " + request.status, true);
            }
        } else {
            print("Waiting...");
        }
    };
    
    request.onerror = function() {
        print("Connection error", true);
    };
    
    request.send();
}