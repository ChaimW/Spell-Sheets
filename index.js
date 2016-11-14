var allDefaultAbilities;    //map[String: DefaultAbility]
var allDefaultEquipment;    //array[String]
var allDefaultClasses;  //map[String: DefaultClass]

var currentPlayer;

var spellARR;
var classXML;

function getXMLDoc(file) {
    var xmlDoc;
    if (window.DOMParser) {
        var parser = new DOMParser();
        xmlDoc = parser.parseFromString(file, "text/xml");
    } else {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(file);
    }
    return xmlDoc;
}

function init() {
    preInit();
    allDefaultAbilities = new Map();
    allDefaultClasses = new Map();
    
    allDefaultAbilities.set("Look the Part", new DefaultAbility("Look the Part", "&#8210;", "&#8210;", "&#8210;"));
    var jsonEntry;
    for (var uniqueName in spellsARR) {
        jsonEntry = spellsARR[uniqueName];
        var newDefaultAbility = new DefaultAbility(jsonEntry.name, jsonEntry.t, jsonEntry.s, jsonEntry.r, jsonEntry.m);
        allDefaultAbilities.set(spellsARR[uniqueName].name, newDefaultAbility);
    }
    allDefaultEquipment = [
        "Arrow, Gray",
        "Arrow, Green",
        "Arrow, Purple",
        "Arrow, Red",
        "Arrow, Yellow",
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
    toArray(getXMLDoc(classXML).getElementsByTagName("classList")).forEach(function(curClassNode, classNodeIndex, allClassNodes) {
        var curClass;
        if (curClassNode.hasAttribute("magic-user")) {
            curClass = new DefaultClass(curClassNode.id, curClassNode.getAttribute("magic-user"));
        } else {
            curClass = new DefaultClass(curClassNode.id, false);
        }
        toArray(curClassNode.getElementsByTagName("level")).forEach(function(curLevelNode, levelNodeIndex, allLevelNodes) {
            var curLevel;
            if (curLevelNode.hasAttribute("points")) {
                curLevel = new Level(levelNodeIndex, curLevelNode.getAttribute("points"));
            } else {
                curLevel = new Level(levelNodeIndex, 0);
            }
            curClass.levels[curLevel.index] = curLevel;
    
            allAbilityNodes = toArray(curLevelNode.getElementsByTagName("abilityEntry")).sort(function(firstNode, secondNode) {
                if (firstNode.getAttribute("abilityName") > secondNode.getAttribute("abilityName")) {
                    return 1;
                } else if (firstNode.getAttribute("abilityName") < secondNode.getAttribute("abilityName")) {
                    return -1;
                } else {
                    return 0;
                }
            });
            allAbilityNodes.forEach(function(curAbilityNode, abilityNodeIndex, allAbilityNodes) {
                curClass.addAbilityEntry(
                    curLevel.index,
                    curAbilityNode.getAttribute("name"),
                    curAbilityNode.getAttribute("abilityName"),
                    curAbilityNode.getAttribute("cost"),
                    curAbilityNode.getAttribute("max"),
                    curAbilityNode.getAttribute("count"),
                    curAbilityNode.getAttribute("per"),
                    curAbilityNode.getAttribute("charge")
                );
            });
        });
        if (curClass.levels.length < 7) {
            curClass.levels[6] = new Level(6, 1);
        }
        curClass.addAbilityEntry(6, "*Look the Part*", "Look the Part", 0, 1, 1, "&#8210;", 0);
        allDefaultClasses.set(curClassNode.id, curClass);
    });
    
}

function loadClass() {
//set playerLevel
    var level = document.getElementById("select-level").selectedIndex;

//set playerClass
    var playerClassName = document.getElementById("select-className");
    playerClassName = playerClassName.options[playerClassName.selectedIndex].text;
    
//set currentPlayer
    currentPlayer = new Player(playerClassName, level);
    currentPlayer.hasLookThePart = false;
    
    update();
}

var unimplementedAbilityNames = ["Avatar of Nature", "Battlemage", "Dervish", "Evoker", "Experienced", "Legend", "Necromancer", "Priest", "Ranger", "Sniper", "Summoner", "Warder", "Warlock"]
function update() {
    console.clear();
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
    currentAbilities.forEach(function(newAbilityEntry, abilityEntryName) {
        if (newAbilityEntry.name == "Look the Part") {
            document.getElementById("current-abilities").innerHTML = "<li>*Look the Part*</li>" + document.getElementById("current-abilities").innerHTML;
        } else {
            var currentAbilityText = "<li>";
            currentAbilityText += newAbilityEntry.name;
            if (newAbilityEntry.per != "&#8210;") {
                currentAbilityText += " (";
                currentAbilityText += newAbilityEntry.count;
                currentAbilityText += " ";
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
    allDefaultEquipment.forEach(function(curEquipment) {
        var currentEquipmentCount = 0;
        currentAbilities.forEach(function(newAbilityEntry) {
            if (newAbilityEntry.ability.equipment.has(curEquipment)) {
                currentEquipmentCount += newAbilityEntry.ability.equipment.get(curEquipment) * newAbilityEntry.count;
            }
        });
        if (currentEquipmentCount > 0) {
            var currentEquipmentText = "";
            currentEquipmentText += "<li>";
            currentEquipmentText += curEquipment;
            if (currentEquipmentCount > 1) {
                currentEquipmentText += " (x";
                currentEquipmentText += formatNumber(currentEquipmentCount).substr(-2);
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
    currentPlayer.playerClass.levels.forEach(function(curLevel) {
        bod = document.createElement("tbody");
        classList = "<tr><td colspan=\"9\"><b>" + curLevel.name();
        if (curLevel.points > 0 && currentPlayer.hasLevelIndex(curLevel.index)) {
            classList += ": </b>" + currentPlayer.getPointsRemainingAtLevelIndex(curLevel.index) + "/" + curLevel.points;
        } else {
            classList += "</b>";
        }
        classList += "</td></tr>";
        curLevel.abilityEntries.forEach(function(abilityEntry) {
            classList += "<tr><td class=\"tooltip\">&nbsp;&nbsp;" + abilityEntry.name;
            classList += "<span class=\"tooltiptext\" id=\"tip " + abilityEntry.name + " @ " + curLevel.index + "\"></span>";
            classList += "</td><td>" + Math.max(abilityEntry.cost, 0) + "</td><td>";
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
            classList += "</td><td>" + abilityEntry.ability.type + "</td><td>" + abilityEntry.ability.school + "</td><td>" + abilityEntry.ability.range + "</td><td>";
            classList += "<button type=\"button\" id=\"rem " + abilityEntry.name + " @ " + curLevel.index + "\" onclick=\"currentPlayer.remAbilityEntry('" + abilityEntry.name + "', '" + curLevel.index + "'); update()\">&#8210;</button>";
            classList += "<span id=\"num " + abilityEntry.name + " @ " + curLevel.index + "\" style=\"font-family:monospace\"></span>";
            classList += "<button type=\"button\" id=\"add " + abilityEntry.name + " @ " + curLevel.index + "\" onclick=\"currentPlayer.addAbilityEntry('" + abilityEntry.name + "','" + curLevel.index + "'); update()\">+</button>";
            classList += "</td><td>";
            classList += "<button type=\"button\" id=\"exp " + abilityEntry.name + " @ " + curLevel.index + "\" onclick=\"currentPlayer.expAbilityEntry('" + abilityEntry.name + "','" + curLevel.index + "'); update()\"></button>";
            classList += "</td></tr>";
        });
        bod.innerHTML = classList;
        document.getElementById("class-list").appendChild(bod);
        
        curLevel.abilityEntries.forEach(function(abilityEntry) {
            document.getElementById("tip " + abilityEntry.name + " @ " + curLevel.index).innerHTML = abilityEntry.ability;
            document.getElementById("num " + abilityEntry.name + " @ " + curLevel.index).innerHTML = "&nbsp;" + formatNumber(currentPlayer.getCountOfAbilityEntry(abilityEntry)) + "&nbsp;";
            if (abilityEntry.ability.name == "Look the Part") {
                document.getElementById("num " + abilityEntry.name + " @ " + curLevel.index).innerHTML = "&nbsp;" + formatNumber(currentPlayer.hasLookThePart) + "&nbsp;";
                document.getElementById("rem " + abilityEntry.name + " @ " + curLevel.index).disabled = !currentPlayer.hasLookThePart;
                document.getElementById("rem " + abilityEntry.name + " @ " + curLevel.index).onclick = function(){currentPlayer.hasLookThePart = false; update()};
                document.getElementById("add " + abilityEntry.name + " @ " + curLevel.index).disabled = currentPlayer.hasLookThePart
                document.getElementById("add " + abilityEntry.name + " @ " + curLevel.index).onclick = function(){currentPlayer.hasLookThePart = true; update()};
            } else if (currentPlayer.hasLevelIndex(curLevel.index) && (abilityEntry.cost != 0 || currentPlayer.playerClass.isMagicUser)) {
                if (unimplementedAbilityNames.indexOf(abilityEntry.ability.name) != -1) {
                    document.getElementById("rem " + abilityEntry.name + " @ " + curLevel.index).innerHTML = "?";
                    document.getElementById("rem " + abilityEntry.name + " @ " + curLevel.index).disabled = true;
                    document.getElementById("add " + abilityEntry.name + " @ " + curLevel.index).innerHTML = "?";
                    document.getElementById("add " + abilityEntry.name + " @ " + curLevel.index).disabled = true;
                } else  {
                    document.getElementById("rem " + abilityEntry.name + " @ " + curLevel.index).disabled = (currentPlayer.getCountOfAbilityEntry(abilityEntry) == 0);
                    document.getElementById("add " + abilityEntry.name + " @ " + curLevel.index).disabled = (currentPlayer.getCostOfAbilityEntry(abilityEntry.name, curLevel.index) == undefined);
                    //if (currentPlayer.playerClass.canExpAbilityEntry(abilityEntry, curLevel.index)) {
                    if (false) {
                        document.getElementById("exp " + abilityEntry.name + " @ " + curLevel.index).style.visibility = "visible";
                        if (currentPlayer.expAbilities.indexOf(abilityEntry) == -1) {
                            //document.getElementById("exp " + abilityEntry.name + " @ " + curLevel.index).disabled = (currentPlayer.expAbilities.length == currentPlayer.getCountOfAbilityName("Experienced"));
                            document.getElementById("exp " + abilityEntry.name + " @ " + curLevel.index).innerHTML = "+";
                        } else {
                            document.getElementById("exp " + abilityEntry.name + " @ " + curLevel.index).innerHTML = "&#8210;";
                        }
                    } else {
                        document.getElementById("exp " + abilityEntry.name + " @ " + curLevel.index).style.visibility = "hidden";
                    }
                }
            } else {
                document.getElementById("rem " + abilityEntry.name + " @ " + curLevel.index).style.visibility = "hidden";
                document.getElementById("add " + abilityEntry.name + " @ " + curLevel.index).style.visibility = "hidden";
                document.getElementById("exp " + abilityEntry.name + " @ " + curLevel.index).style.visibility = "hidden";
            }
        });
    });
}

function Player(playerClassName, level) {
    this.playerClass = allDefaultClasses.get(playerClassName);
    this.level = Number(level);
    this.hasLookThePart = true;
    
    this.hasLevelIndex = function Player_hasLevelIndex(levelIndex) {
        return levelIndex <= this.level || (levelIndex == 6 && this.hasLookThePart == true);
    }
    
    this.maxPoints = new Array();
    this.points = new Map();
    this.counts = new Map();
    this.expAbilities = new Array();
    
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
        print("found level " + this.playerClass.levels[levelIndex].name());
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
    this.levels = new Array();
    
    this.indexOfLevelName = function DefaultClass_indexOfLevelName(levelName, maximumLevelIndex, minimumLevelIndex) {
        if (maximumLevelIndex == undefined) {
            maximumLevelIndex = 6;
        } else {
            maximumLevelIndex = Math.minimum(maximumLevelIndex, 6);
        }
        if (minimumLevelIndex == undefined) {
            minimumLevelIndex = 0;
        } else {
            maximumLevelIndex = Math.maximum(minimumLevelIndex, 0);
        }
        while(minimumLevelIndex < maximumLevelIndex) {
            if(this.levels[minimumLevelIndex].name() == levelName) {
                return minimumLevelIndex;
            } else {
                minimumLevelIndex++;
            }
        }
        return -1;
    };
    
    this.addAbilityEntry = function DefaultClass_addAbilityEntry(levelIndex, name, abilityName, cost, max, count, per, charge) {
        var level = this.levels[levelIndex];
        //console.log(this.name);
        if (level == undefined || level.indexOfAbilityName(abilityName) != -1) {
            print("cannot add ability entry " + name + " at level index " + levelIndex);
        } else {
            var abilityEntry = new AbilityEntry(name, abilityName, 0, 1, 1, "&#8210;", 0);
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
            level.abilityEntries.unshift(abilityEntry);
            level.abilityEntries.sort(sortByName);
        }
    };

    this.getAbilityEntry = function DefaultClass_getAbilityEntry(abilityEntryName, levelIndex) {
        var level = this.levels[levelIndex];
        if (level == undefined) {
            print(abilityName + ": level index " + levelIndex + " does not exist");
            return undefined;
        } else {
            var abilityEntryIndex = level.indexOfAbilityEntry(abilityEntryName);
            if (abilityEntryIndex != -1) {
                return level.abilityEntries[abilityEntryIndex];
            } else {
                print(abilityName + ": does not exist at level " + level.name());
                return undefined;
            }
        }
    };
    
    this.canExpAbilityEntry = function DefaultClass_canExpAbilityEntry(abilityEntry, levelIndex) {
        if (levelIndex < 4 && this.levels[levelIndex] != undefined) {
            if (this.levels[levelIndex].hasAbilityEntry(abilityEntry)) {
                if (abilityEntry.ability.type == "Verbal" && (abilityEntry.per == "Life" || abilityEntry.per == "Refresh") && abilityEntry.charge == 0) {
                    return true;
                }
            }
        }
        return false;
    }
}

function AbilityEntry(name, abilityName, cost, max, count, per, charge) {
    this.name = String(name);
    this.ability = allDefaultAbilities.get(abilityName);
    this.cost = Number(cost);
    this.max = Number(max);
    this.count = Number(count);
    this.per = String(per);
    this.charge = Number(charge);
    
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

function Level(index, points) {
    this.index = Number(index);
    this.points = Number(points);
    this.abilityEntries = new Array();
    
    this.name = function() {
        return [
            "1st Level",
            "2nd Level",
            "3rd Level",
            "4th Level",
            "5th Level",
            "6th Level",
            "Look the Part"
        ][this.index];
    };
    
    this.indexOfAbilityEntry = function Level_indexOfAbilityEntry(abilityEntryName) {
        for (var i = 0; i < this.abilityEntries.length; i++) {
            if (this.abilityEntries[i].name == abilityEntryName) {
                return i;
            }
        }
        return -1;
    };
    
    this.indexOfAbilityName = function Level_indexOfAbilityName(abilityName) {
        for (var i = 0; i < this.abilityEntries.length; i++) {
            //console.log(this.name() + "[" + i + "]=" + this.abilityEntries[i].ability.name);
            if (this.abilityEntries[i].ability.name == abilityName) {
                return i;
            }
        }
        return -1;
    };
    
    this.hasAbilityEntry = function Level_hasAbilityEntry(abilityEntry) {
        return (this.abilityEntries.indexOf(abilityEntry) != -1);
    };
    
    this.toString = function() {
        return this.name();
    }
}

function DefaultAbility(name, type, school, range, newEquipment) {
    this.name = String(name);
    this.uniqueName = this.name.toLowerCase().replace(new RegExp(" ", "g"), "").replace(new RegExp(",","g"), "").replace(new RegExp(":","g"), "");
    this.type = String(type);
    this.school = String(school);
    if (range == undefined) {
        this.range = "&#8210;";
    } else {
        this.range = String(range);
    }
    this.equipment = new Map();
    if (newEquipment != undefined && newEquipment.length > 0 && newEquipment != "No strip required") {
        newEquipment.sort();
        for (var i = 0; i < newEquipment.length; i++) {
            if (this.equipment.has(newEquipment[i])) {
                this.equipment.set(newEquipment[i], this.equipment.get(newEquipment[i]) + 1);
            } else {
                this.equipment.set(newEquipment[i], 1);
            }
        }
    }
    
    this.toString = function() {
        if (this.name == "Look the Part") {
            return "<b>Look the Part:</b> This is an extra Ability that is available to a player only if they actively role-play or portray their class. Examples would be acting consistently in character in battlegames, having good class-specific garb, and meaningfully  contributing to the atmosphere of the game. This ability need not meet a cookie-cutter definition of the class; any dedicated behavior consistent with a backstory can work. Barbarian, for example, could be played as a refined Samurai rather than a raging viking and still qualify for the bonus. Look The Part abilities are available at first level and are in addition to all other class abilities. Example: A player has a Look The Part ability of Scavenge 1/Life and a normal class ability of Scavenge 1/Life would have Scavenge 2/life. Who qualifies for Look The Part is game-by-game bonus awarded by the group monarch or joint decision of the game reeve and the guildmaster for the class.";
        }
        var out = "";
        out += "<div style=\"font-size:20px;font-weight:bold;font-variant:small-caps;\">" + spellsARR[this.uniqueName].name + "</div>";
        if (spellsARR[this.uniqueName].t != undefined) {
            out += "<b>T:</b> " + spellsARR[this.uniqueName].t + "<br>";
        }
        if (spellsARR[this.uniqueName].s != undefined) {
            out += "<b>S:</b> " + spellsARR[this.uniqueName].s + "<br>";
        }
        if (spellsARR[this.uniqueName].r != undefined) {
            out += "<b>R:</b> " + spellsARR[this.uniqueName].r + "<br>";
        }
        if (spellsARR[this.uniqueName].i != undefined) {
            out += "<b>I:</b> " + spellsARR[this.uniqueName].i + "<br>";
        }
        if (spellsARR[this.uniqueName].m != undefined) {
            out += "<b>M:</b> " + spellsARR[this.uniqueName].m + "<br>";
        }
        if (spellsARR[this.uniqueName].e != undefined) {
            out += "<b>E:</b> " + spellsARR[this.uniqueName].e + "<br>";
        }
        if (spellsARR[this.uniqueName].l != undefined) {
            out += "<b>L:</b> " + spellsARR[this.uniqueName].l + "<br>";
        }
        if (spellsARR[this.uniqueName].n != undefined) {
            out += "<b>N:</b> " + spellsARR[this.uniqueName].n + "<br>";
        }
        return String(out);
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

var outputMessagesFrom = ["!update", "!Player_getCostOfAbilityEntry", "!Player_getPointsRemainingAtLevelIndex", "!Player_getPointsSpentOnAbilityEntry", "!Player_addAbilityEntry", "DefaultClass_addAbilityEntry"];

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
    text += playerObj.playerClass.name + ", " + playerObj.playerClass.levels[playerObj.level].name() + "\n";
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
        playerObj.playerClass.levels.map(function(level) {
            return playerObj.getPointsRemainingAtLevelIndex(level.index);
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
    {spellsARR = {
        "abeyance": {
            "classes": {
                "Healer": "5"
            },
            "e": "Target is Stunned for 60 seconds. Ignores armor",
            "i": "\"The strength of aether is mine to evoke\" x3",
            "keywords": "abeyance ball green subdual healer",
            "m": ["Magic Ball, Green"],
            "name": "Abeyance",
            "r": "Ball",
            "s": "Subdual",
            "t": "Magic Ball"
        },

        "adaptiveblessing": {
            "name": "Adaptive Blessing",
            "keywords": "enchantment white healer scout",
            "classes": {
                "Healer": "2",
                "Scout": "6"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with this blessing\" x3",
            "m": ["Strip, White"],
            "e": "Bearer becomes Resistant to one of the following Schools: Death, Flame, Subdual, Command, Sorcery. School is chosen at the time of casting. Does not count towards a players Enchantment limit, may not be worn with any other Enchantments from the Protection School"
        },
          
        "adaptiveprotection": {
            "name": "Adaptive Protection",
            "keywords": "enchantment white healer",
            "classes": {
                "Healer": "3"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with this protection\" x3",
            "m": ["Strip, White"],
            "e": "earer becomes Immune to one of the following Schools: Death, Flame, Subdual, Command, Sorcery. School is chosen at the time of casting"
        },

        "adrenaline": {
            "name": "Adrenaline",
            "keywords": "verbal spirit barbarian",
            "classes": {
                "Barbarian": "3"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Self",
            "i": "\"Adrenaline\"",
            "e": "Player heals a wound",
            "l": "May only be used within 30 seconds of killing an enemy in melee combat or causing the activation of any effects which allow the player struck to avoid death such as Undead Minion, Song of Survival, or other similar magic and abilities. May not be used within 10’ of a living enemy",
            "n": "May only be used by the player striking the final blow and only once per kill per eligible enemy"
        },

        "agoraphobia": {
            "name": "Agoraphobia",
            "keywords": "bard verbal command",
            "classes": {
                "Bard": "5"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thee to be alone\" x3",
            "e": "Target must remain at least 20’ away from all other players unless forced there by another Magic or Ability. Lasts 30 seconds."
        },

        "amplification": {
            "name": "Amplification",
            "keywords": "bard verbal sorcery",
            "classes": {
                "Bard": "4"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"My power amplifies thine\"",
            "e": "Target player’s next Verbal magic is affected as per Extension",
            "l": "May not be used on the caster"
        },

        "ambulant": {
            "name": "Ambulant",
            "keywords": "bard druid healer wizard meta magic",
            "classes": {
                "Bard": "5",
                "Druid": "5",
                "Healer": "5",
                "Wizard": "5"
            },
            "t": "Meta-Magic",
            "s": "Neutral",
            "i": "\"Ambulant\"",
            "e": "An incantation may be said while moving. May be cast while moving",
            "l": "May not be used on the Charge incantation"
        },

        "ancestralarmor": {
            "name": "Ancestral Armor",
            "keywords": "healer warrior enchantment protection",
            "classes": {
                "Healer": "6",
                "Warrior": "6"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "<br>\"May this armor protect you from all forms of harm.<br>May the flames of the fire not burn you.<br>May the bolts from the heavens not strike you.<br>May the arrows of your enemies not pierce you.<br>May this armor protect you from all forms of harm\"",
            "m": ["Strip, White"],
            "e": "The effects of a Magic Ball, projectile, or weapon which just struck armor worn by the player is ignored, even if the object would not otherwise affect the armor. The armor loses one point of value in the location struck. This effect will not trigger if the armor has no points left in the location struck. Ancestral Armor is not expended after use and will continue to provide protection until removed with Dispel Magic or similar magic or abilities",
            "l": "Phase Arrow and Phase Bolt interact with armor worn by the bearer as though Ancestral Armor was not present",
            "n": "Abilities that ignore armor do not trigger Ancestral Armor"
        },

        "assassinate": {
            "name": "Assassinate",
            "keywords": "assassin verbal death",
            "classes": {
                "Assassin": "1"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "Say the word \"Assassinate\" immediately upon killing a person.",
            "e": "The victim is Cursed"
        },

        "astralintervention": {
            "name": "Astral Intervention",
            "keywords": "healer wizard verbal command",
            "classes": {
                "Healer": "3",
                "Wizard": "2"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thee to retreat into the aether\" x 3",
            "e": "Target player becomes Insubstantial for 30 seconds"
        },

        "attuned": {
            "name": "Attuned",
            "keywords": "druid enchantment sorcery",
            "classes": {
                "Druid": "3"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I enchant thee with attune\" x3",
            "m": ["Strip, Yellow"],
            "e": "May wear an additional Enchantment. Attuned does not count towards the bearer’s Enchantment limit",
            "l": "This ability may not be used in conjunction with any other similar ability or magic"
        },

        "avatarofnature": {
            "name": "Avatar of Nature",
            "keywords": "druid avatar nature",
            "classes": {
                "Druid": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "All the casters Enchantments of level 4 and below are now range Self instead of their previous range. Does not apply to Golem"
        },

        "awe": {
            "name": "Awe",
            "keywords": "bard paladin anti verbal command",
            "classes": {
                "Anti-Paladin": "1",
                "Bard": "3",
                "Paladin": "1"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thee awed\" x3",
            "e": "Target may not attack or cast magic at the caster. Target must remain at least 20’ away from the caster unless forced there by another Magic or Ability. Lasts 30 seconds",
            "n": "If the caster attacks or begins casting another magic at the target, this spell’s effect is negated"
        },

        "banish": {
            "name": "Banish",
            "keywords": "banish healer wizard insubstantial spirit",
            "classes": {
                "Healer": "1",
                "Wizard": "1"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "20",
            "i": "\"The Spirits banish thee from this place\" x3",
            "e": "Target Insubstantial player must return to their respawn location where their Insubstantial State immediately ends",
            "n": "A player bearing Undead Minion or Greater Undead Minion who is currently Insubstantial has their Enchantment removed"
        },

        "barkskin": {
            "name": "Barkskin",
            "keywords": "druid enchantment protection",
            "classes": {
                "Druid": "1"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with barkskin\" x3",
            "m": ["Strip, White"],
            "e": "Bearer gains one point of Magic Armor"
        },

        "battlefieldtriage": {
            "name": "Battlefield Triage",
            "keywords": "bard enchantment spirit",
            "classes": {
                "Bard": "3"
            },
            "t": "Enchantment",
            "s": "Spirit",
            "r": "Self or Touch",
            "i": "\“Be a bastion of healing\” x3",
            "m": ["Strip, Yellow", "Strip, Yellow", "Strip, Yellow", "Strip, Yellow"],
            "e": "Bearer is Stopped. Bearer may cast Greater Heal by announcing \"[Player] thou art made whole\". Bearer must remove an Enchantment strip after each use of Greater Heal",
            "n": "Battlefield Triage is removed when the last strip is removed"
        },

        "battlemage": {
            "name": "Battlemage",
            "keywords": "wizard ambulant",
            "classes": {
                "Wizard": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Use of Ambulant becomes unlimited",
            "l": "May not purchase Enchantments or Magic Balls"
        },

        "bearstrength": {
            "name": "Bear Strength",
            "keywords": "druid enchantment sorcery",
            "classes": {
                "Druid": "3"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I enchant thee with the strength of the bear\" x3",
            "m": ["Strip, Red"],
            "e": "Bearer’s melee weapons are Shield Crushing"
        },

        "berserk": {
            "name": "Berserk",
            "keywords": "barbarian enchantment sorcery",
            "classes": {
                "Barbarian": "1"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Self",
            "m": ["Strip, Red"],
            "e": "All weapons wielded in melee are Armor Breaking"
        },

        "blessedaura": {
            "name": "Blessed Aura",
            "keywords": "healer enchantment protection",
            "classes": {
                "Healer": "5"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thy person, arms, and armor\" x3",
            "m": ["Strip, White"],
            "e": "Resistant to the next effect which would inflict a Wound, Death, State, or the next effect which would negatively affect them or their equipment. Does not trigger against effects cast by the player"
        },

        "blessingagainstharm": {
            "name": "Blessing Against Harm",
            "keywords": "healer enchantment protection",
            "classes": {
                "Healer": "4"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee against all harm\" x3",
            "m": ["Strip, White"],
            "e": "Resistant to the next effect which would inflict a Wound, Death, State, or other negative effect. Does not trigger against effects cast by the player"
        },

        "blessingagainstwounds": {
            "name": "Blessing Against Wounds",
            "keywords": "healer enchantment protection",
            "classes": {
                "Healer": "1"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee against wounds\" x3",
            "m": ["Strip, White"],
            "e": "Resistant to Wounds. Does not count towards a players Enchantment limit",
            "l": "May not be worn with any other Enchantments from the Protection School"
        },

        "blink": {
            "name": "Blink",
            "keywords": "assassin verbal sorcery insubstantial",
            "classes": {
                "Assassin": "3"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"I vanish from sight\"",
            "e": "Player becomes Insubstantial and can move to any location within 50’ from their starting point",
            "l": "Caster may not end State within 10’ of a living enemy"
        },

        "bloodandthunder": {
            "name": "Blood and Thunder",
            "keywords": "barbarian verbal spirit",
            "classes": {
                "Barbarian": "1"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Self",
            "i": "\"Blood and Thunder!\"",
            "e": "Player gains Blessing Against Wounds",
            "l": "May only be used within 30 seconds of killing an enemy in melee combat or causing the activation of any effects which allow the player struck to avoid death such as Undead Minion, Song of Survival, or other similar magic and abilities. May not be used within 10’ of a living enemy",
            "n": "May only be used by the player striking the final blow and only once per kill per eligible enemy. Player must still wear a white strip to denote Blessing Against Wounds"
        },

        "breakconcentration": {
            "name": "Break Concentration",
            "keywords": "bard wizard verbal command suppressed",
            "classes": {
                "Bard": "3",
                "Wizard": "2"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thee suppressed\"",
            "e": "Target player is suppressed for 10 seconds"
        },

        "brutalstrike": {
            "name": "Brutal Strike",
            "keywords": "anti paladin barbarian verbal death cursed suppressed",
            "classes": {
                "Anti-Paladin": "4",
                "Barbarian": "5"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "Unlimited",
            "i": "\"And stay down!\"",
            "e": "Victim is Cursed. Victim is also Suppressed for 30 seconds",
            "l": "Must be used immediately upon the caster dealing a Wound to the victim in melee combat"
        },

        "calllightning": {
            "name": "Call Lightning",
            "keywords": "druid verbal flame",
            "classes": {
                "Druid": "6"
            },
            "t": "Verbal",
            "s": "Flame",
            "r": "20",
            "i": "\"I call lightning’s flame to strike thee\" x3",
            "e": "Target player dies"
        },

        "cancel": {
            "name": "Cancel",
            "keywords": "bard druid healer wizard",
            "classes": {
                "Bard": "1",
                "Druid": "1",
                "Healer": "1",
                "Wizard": "1"
            },
            "t": "Neutral",
            "s": "Neutral",
            "r": "Touch",
            "i": "\"My work shall be undone\" x3",
            "e": "Remove an Enchantment cast by the caster"
        },

        "circleofprotection": {
            "name": "Circle of Protection",
            "keywords": "healer enchantment protection insubstantial",
            "classes": {
                "Healer": "4"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"Circle of Protection\" x3",
            "e": "The caster and up to five willing players in physical contact with the caster become Insubstantial. The caster may end Circle of Protection at any time by ending his Insubstantial State with the standard Incantation. If the caster stops being Insubstantial by any means, the Enchantment ends. Players under the effect of Circle of Protection may use magic and abilities on players under the effect of the same Circle of Protection as though they were not Insubstantial",
            "n": "Effects which would normally remove the Insubstantial State (Tracking, Release, etc) will remove this Enchantment"
        },

        "combatcaster": {
            "name": "Combat Caster",
            "keywords": "bard",
            "classes": {
                "Bard": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Does not require an empty hand to cast Magic"
        },

        "confidence": {
            "name": "Confidence",
            "keywords": "bard verbal sorcery",
            "classes": {
                "Bard": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"My power grants thee confidence\"",
            "e": "Target player may instantly Charge a single Magic or Ability",
            "l": "May not be used on self. May not be used within 20’ of a living enemy"
        },

        "contagion": {
            "name": "Contagion",
            "keywords": "wizard enchantment death",
            "classes": {
                "Wizard": "5"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "\"May thou bear this plague to all\" x3",
            "m": ["Strip, Red"],
            "e": "All melee weapons wielded by player are Wounds Kill. Bearer is Fragile"
        },

        "corrosivemist": {
            "name": "Corrosive Mist",
            "keywords": "druid enchantment death",
            "classes": {
                "Druid": "1"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Self or Touch",
            "i": "\"The mists of corrosion surround thee\" x3",
            "m": ["Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red"],
            "e": "Bearer is Stopped. Bearer may cast Destroy Armor by announcing \"[Player] the mists of corrosion destroy your [armor location] armor\". Bearer must remove a strip after each use of Destroy Armor",
            "n": "Corrosive Mist is removed when the last strip is removed"
        },

        "coupdegrace": {
            "name": "Coup de Grace",
            "keywords": "some lowercase separated words used to search",
            "classes": {
                "Assassin": "6"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"Death shall come for thee\" x3",
            "e": "Target player dies",
            "l": "Target must be Wounded prior to starting the Incantation"
        },

        "dervish": {
            "name": "Dervish",
            "keywords": "bard",
            "classes": {
                "Bard": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Equipment costs are doubled. Each Verbal purchased gives double the uses. Example: 1/Life Charge x3 becomes 2/life Charge x3, 2/life becomes 4/life, 1/Refresh becomes 2/Refresh"
        },

        "destroyarmor": {
            "name": "Destroy Armor",
            "keywords": "wizard verbal death",
            "classes": {
                "Wizard": "4"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"Death destroys thy [hit location] armor\" x3",
            "e": "Armor on target hit location is subjected to Armor Destroying"
        },

        "destructionarrow": {
            "name": "Destruction Arrow",
            "keywords": "arrow archer sorcery",
            "classes": {
                "Archer": "1"
            },
            "t": "Specialty Arrow",
            "s": "Sorcery",
            "i": "\"Destruction Arrow\"",
            "m": ["Arrow, Red (Destruction)"],
            "e": "This arrow is Armor Destroying and Shield Destroying. Armor Destroying and Shield Destroying are applied after the normal effect of being hit with an arrow is applied"
        },

        "dimensionalrift": {
            "name": "Dimensional Rift",
            "keywords": "wizard verbal sorcery",
            "classes": {
                "Wizard": "4"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"The power of the aether consumes thee\" x3",
            "e": "Target Insubstantial player dies"
        },

        "discordia": {
            "name": "Discordia",
            "keywords": "bard command enchantment",
            "classes": {
                "Bard": "5"
            },
            "t": "Enchantment",
            "s": "Command",
            "r": "Self",
            "i": "\"My discordant melodies shall stymie my foes\" x3",
            "m": ["Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red"],
            "e": "Tie on five enchantment strips. Bearer may cast Break Concentration by announcing \"[Player] thou art suppressed\" and removing an enchantment strip. Enchantment is removed when the last strip is removed"
        },

        "dispelmagic": {
            "name": "Dispel Magic",
            "keywords": "druid healer scout wizard verbal sorcery",
            "classes": {
                "Druid": "3",
                "Healer": "5",
                "Scout": "3",
                "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"By my power I dispel that magic\" x3",
            "e": "All Enchantments on target are removed",
            "n": "Will work through Protection from Magic, Enlightened Soul, and similar magics and abilities. Will work on players that are Frozen or Insubstantial"
        },

        "draggedbelow": {
            "name": "Dragged Below",
            "keywords": "wizard verbal death",
            "classes": {
                "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"Death comes for thee from below\" x3",
            "e": "Target Stopped player dies"
        },

        "elementalbarrage": {
            "name": "Elemental Barrage",
            "keywords": "wizard verbal sorcery ball",
            "classes": {
                "Wizard": "6"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"I am filled with the power of magic\"",
            "e": "Caster may use Magic Balls they are currently carrying by stating the name of the Magic Ball immediately prior to throwing the ball in place of the incantation",
            "l": "This magic ends if the caster picks up any additional Magic Balls or begins casting any new magic"
        },

        "empower": {
            "name": "Empower",
            "keywords": "bard verbal sorcery",
            "classes": {
                "Bard": "2"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I empower thee\"",
            "e": "Target player regains one use of any per-life Ability or Magic they have expended",
            "l": "Does not function on Empower, Confidence, Restoration, or similar Magic and Abilities. May not be used on the caster",
            "n": "Does not allow a player to have more than his maximum uses of a Magic or Ability."
        },

        "enlightenedsoul": {
            "name": "Enlightened Soul",
            "keywords": "healer monk enchantment protection",
            "classes": {
                "Healer": "5",
                "Monk": "1"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"A distant magic has no hold upon thy now enlightened soul\" x3",
            "m": ["Strip, White"],
            "e": "Player is unaffected by Verbal magic used at a Range greater than Touch",
            "l": "Effects beneficial magic as well as harmful magic"
        },

        "entangle": {
            "name": "Entangle",
            "keywords": "druid healer wizard ball subdual stopped",
            "classes": {
                "Druid": "1",
                "Healer": "2",
                "Wizard": "2"
            },
            "t": "Magic Ball",
            "s": "Subdual",
            "r": "Ball",
            "i": "\"The strength of earth is mine to evoke\" x3",
            "m": ["Magic Ball, Brown"],
            "e": "Target is Stopped for 60 seconds. Engulfing"
        },

        "equipmentarmor1point": {
            "name": "Equipment: Armor, 1 Point",
            "keywords": "bard",
            "classes": {
                "Bard": "2"
            },
            "t": "Neutral",
            "e": "May wear one additional point of armor"
        },

        "equipmentshieldmedium": {
            "name": "Equipment: Shield, Medium",
            "keywords": "bard healer shield medium",
            "classes": {
                "Bard": "5",
                "Healer": "3"
            },
            "t": "Neutral",
            "e": "May use up to a medium shield"
        },

        "equipmentshieldsmall": {
            "name": "Equipment: Shield, Small",
            "keywords": "bard druid healer shield small",
            "classes": {
                "Bard": "3",
                "Druid": "2",
                "Healer": "1"
            },
            "t": "Neutral",
            "e": "May use up to a small shield"
        },

        "equipmentweapongreat": {
            "name": "Equipment: Weapon, Great",
            "keywords": "druid weapon great",
            "classes": {
                "Druid": "5"
            },
            "t": "Neutral",
            "e": "May use any great weapon. May use one such weapon at a time for each instance purchased"
        },

        "equipmentweaponhinged": {
            "name": "Equipment: Weapon, Hinged",
            "keywords": "druid weapon great",
            "classes": {
            "Healer": "2"
            },
            "t": "Neutral",
            "e": "May use any hinged weapon. May use one such weapon at a time for each instance purchased"
        },

        "equipmentweaponlong": {
            "name": "Equipment: Weapon, Long",
            "keywords": "bard druid wizard weapon long",
            "classes": {
                "Bard": "4",
                "Druid": "4",
                "Wizard": "5"
            },
            "t": "Neutral",
            "e": "May use any long weapon. May use one such weapon at a time for each instance purchased"
        },

        "equipmentweaponshort": {
            "name": "Equipment: Weapon, Short",
            "keywords": "bard druid wizard weapon short",
            "classes": {
                "Bard": "1",
                "Druid": "1",
                "Healer": "1",
                "Wizard": "1"
            },
            "t": "Neutral",
            "e": "May use any short weapon. May use one such weapon at a time for each instance purchased"
        },

        "essencegraft": {
            "name": "Essence Graft",
            "keywords": "druid enchantment sorcery",
            "classes": {
                "Druid": "5"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"Open up and receive my power\" x3",
            "m": ["Strip, Yellow"],
            "e": "Bearer may wear up to three additional Enchantments. Essence Graft does not count towards the bearer’s Enchantment limit",
            "l": "Bearer may only wear Enchantments from the caster of Essence Graft. This ability may not be used in conjunction with any other similar ability or magic"
        },

        "evoker": {
            "name": "Evoker",
            "keywords": "wizard",
            "classes": {
                "Wizard": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Verbals purchased may only be of range Touch or Self. Elemental Barrage becomes Charge x10",
            "n": "Elemental Barrage must still be purchased"
        },

        "evolution": {
            "name": "Evolution",
            "keywords": "scout enchantment sorcery",
            "classes": {
                "Scout": "4"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Self",
            "e": "May wear an additional Enchantment. Evolution does not count towards the bearer’s Enchantment limit",
            "n": "This ability does work in conjunction with Attuned or Essence Graft so long as the other limitations of those Enchantments are followed"
        },

        "experienced": {
            "name": "Experienced",
            "keywords": "bard druid healer wizard experiended",
            "classes": {
                "Bard": "1",
                "Druid": "1",
                "Healer": "1",
                "Wizard": "1"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "A single per-life Verbal purchased becomes Charge x5 in addition to the normal frequency OR a single per- refresh Verbal purchased becomes Charge x10 in addition to the normal frequency. This Verbal must be determined before the game begins and cannot be changed",
            "l": "Verbal must be 4th level or lower"
        },

        "extendimmunities": {
            "name": "Extend Immunities",
            "keywords": "paladin enchantment protection",
            "classes": {
                "Paladin": "3"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "Tie strip on target: \"May the blessing of my god protect thee\" x3",
            "m": ["Strip, White"],
            "e": "The target player gains either Resistant to Command or Resistant to Death",
            "l": "Type of Ability must be chosen at the time of casting and may not be changed. The caster may only have one instance of Extend Immunities active at a time"
        },

        "extension": {
            "name": "Extension",
            "keywords": "bard druid healer wizard meta magic",
            "classes": {
                "Bard": "3",
                "Druid": "3",
                "Healer": "3",
                "Wizard": "3"
            },
            "t": "Meta-Magic",
            "s": "Neutral",
            "i": "\"Extension\"",
            "e": "Verbal becomes 50'. Only works on verbals with a range of 20'"
        },

        "fightafterdeath": {
            "name": "Fight After Death",
            "keywords": "barbarian sorcery",
            "classes": {
                "Barbarian": "2"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"Fight after death\" immediately after dying",
            "e": "Player continues to fight for seven seconds after being killed. Players must Chant this time out loud. As per Chanting, failure to count immediately ends the effect. Players do not receive further Wounds during Fight After Death. Players melee weapons are Shield Crushing",
            "l": "Players may not activate Abilities or Magic during Fight After Death. Players may not activate Fight After Death if they died while Suppressed, Stunned, Insubstantial, or Frozen. States on the player (Such as Stopped) persist until Fight After Death has ended and are then removed as per the rules for player death. Players may not achieve game objectives nor carry game items while affected by Fight After Death, though they may still kill other players even if that player is a game objective",
            "n": "Reeves are encouraged to remove this ability from those who use it in an unsafe manner. Also note that it was clarified online that if a player moves during fight after death they must be summon resurrected from their respawn location since they have moved from where they died"
        },

        "fingerofdeath": {
            "name": "Finger of Death",
            "keywords": "wizard verbal death",
            "classes": {
                "Wizard": "6"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"I call upon death to smite thee\" x3",
            "e": "Target player dies"
        },

        "fireball": {
            "name": "Fireball",
            "keywords": "wizard ball flame",
            "classes": {
                "Wizard": "4"
            },
            "t": "Magic Ball",
            "s": "Flame",
            "r": "Ball",
            "i": "\"The flame of fire is mine to evoke\" x3",
            "m": ["Magic Ball, Red"],
            "e": "Fireball will have one of the following effects on the object first struck:<br>1. A weapon hit is destroyed<br>2. A shield hit is subject to Shield Destroying<br>3. Armor hit with Armor Points remaining is subject to Armor Destroying<br>4. A player hit receives a Wounds Kill Wound to that hit location"
        },

        "flameblade": {
            "name": "Flame Blade",
            "keywords": "druid enchantment flame",
            "classes": {
                "Druid": "4"
            },
            "t": "Enchantment",
            "s": "Flame",
            "r": "Touch",
            "i": "\"The element of fire shall infuse your weapons\" x3",
            "m": ["Strip, Red", "Strip, White"],
            "e": "Bearer’s melee weapons are Armor Breaking and Shield Crushing. Bearer and their weapons are Immune to Flame"
        },

        "forcebarrier": {
            "name": "Force Barrier",
            "keywords": "wizard verbal sorcery",
            "classes": {
                "Wizard": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"I shall not be harmed\"",
            "e": "Player is Frozen for 30 seconds"
        },

        "forcebolt": {
            "name": "Force Bolt",
            "keywords": "druid wizard bolt ball sorcery",
            "classes": {
              "Druid": "4",
                "Wizard": "1"
            },
            "t": "Magic Ball",
            "s": "Sorcery",
            "r": "Ball",
            "i": "\"Forcebolt\" x3",
            "m": ["Magic Ball, Blue"],
            "e": "Force Bolt will have one of the following effects on the object first struck:<br>1. A weapon hit is destroyed<br>2. Armor hit with Armor Points remaining is subject to Armor Breaking<br>3. A player hit receives a Wound to that hit location"
        },

        "giftofair": {
            "name": "Gift of Air",
            "keywords": "druid enchantment protection",
            "classes": {
                "Druid": "5"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I grant thee a gift of the air\" x3",
            "m": ["Strip, White"],
            "e": "When struck by a melee weapon or projectile the bearer instead announces \"Gift of Air\" and becomes Insubstantial. The bearer treats the triggering event as though it had no effect on them other than triggering Gift of Air. Bearer may choose to return directly to their respawn location immediately after Gift of Air activates. Melee weapons with the Armor Breaking, Armor Destroying, Shield Crushing, or Shield Destroying Special Effects will wound the bearer as normal and do not trigger Gift of Air",
            "l": "Bearer may not wield weapons or shields",
            "n": "Bearer may end the Insubstantial state caused by Gift of Air at any time with the standard Incantation"
        },

        "giftofearth": {
            "name": "Gift of Earth",
            "keywords": "druio enchantment protection suppressed",
            "classes": {
                "Druid": "2"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I grant thee a gift of the earth\" x3",
            "m": ["Strip, White"],
            "e": "Bearer gains two points of magic armor and is affected as per Greater Harden. Bearer is Suppressed"
        },

        "giftoffire": {
            "name": "Gift of Fire",
            "keywords": "druid enchantment sorcery",
            "classes": {
                "Druid": "3"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I grant thee a gift of the fire\" x3",
            "m": ["Strip, Red", "Strip, White"],
            "e": "Bearer is Immune to Flame and gains Heat Weapon 1/Refresh Charge x3"
        },

        "giftofwater": {
            "name": "Gift of Water",
            "keywords": "druid enchantment sorcery",
            "classes": {
                "Druid": "4"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I grant thee a gift of the water\" x3",
            "m": ["Strip, White", "Strip, Yellow"],
            "e": "Bearer gains one point of magic armor and Heal (self- only) unlimited"
        },

        "golem": {
            "name": "Golem",
            "keywords": "druid enchantment sorcery",
            "classes": {
                "Druid": "4"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"From earth and clay I form thee\" x3",
            "m": ["Strip, Red", "Strip, White"],
            "e": "Bearer is Immune to Death. Bearer is Cursed. Bearer can remove a Wound via Mend. Bearer may use the caster as an alternate respawn point while the caster is alive. Non-magical armor worn affected as per Imbue Armor",
            "l": "A caster may only have a single Golem Enchantment active at a time",
            "n": "All Enchantments worn by the Bearer, including Golem, are Persistent while Golem is worn"
        },

        "graspingtentacles": {
            "name": "Grasping Tentacles",
            "keywords": "druid enchantment command",
            "classes": {
                "Druid": "6"
            },
            "t": "Enchantment",
            "s": "Command",
            "r": "Self",
            "i": "\"The hands of the earth rise to your bidding\" x3",
            "m": ["Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red"],
            "e": "Bearer is Stopped. Bearer may cast Hold Person by announcing \"[Player] stop at my command.\" Bearer must remove an Enchantment strip after each use of Hold Person",
            "n": "Grasping Tentacles is removed when the last strip is removed"
        },

        "greaterharden": {
            "name": "Greater Harden",
            "keywords": "healer enchantment protection",
            "classes": {
                "Healer": "3"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with Greater Harden\" x3",
            "m": ["Strip, White"],
            "e": "Shields and weapons wielded by the player are affected as per Harden. May only be cast on a player"
        },

        "greaterheal": {
            "name": "Greater Heal",
            "keywords": "healer verbal spirit",
            "classes": {
                "Healer": "4"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Touch",
            "i": "\"By the grace of the divine thou art healed\" x5",
            "e": "All wounds are healed. Ignores the Cursed State"
        },

        "greatermend": {
            "name": "Greater Mend",
            "keywords": "druid wizard verbal sorcery",
            "classes": {
                "Druid": "3",
                "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"Return this [object name] to its former glory\" x5",
            "e": "Will repair a destroyed item or restore all armor points in one location"
        },

        "greaterrelease": {
            "name": "Greater Release",
            "keywords": "bard healer verbal sorcery",
            "classes": {
                "Bard": "2",
                "Healer": "2"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"From all thine afflictions thou art released\" x2",
            "e": "All ongoing effects and States are removed from the target. The caster may choose to leave some States or effects in place",
            "n": "Greater Release may target Dead players"
        },

        "greaterresurrect": {
            "name": "Greater Resurrect",
            "keywords": "healer verbal spirit",
            "classes": {
                "Healer": "5"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Touch",
            "i": "\"By the grace of the divine thou art resurrected\" x5",
            "e": "Target Dead player is returned to life. Enchantments on the player are retained. Any wounds on the player are healed. Works regardless of any States on the target"
        },

        "greaterundeadminion": {
            "name": "Greater Undead Minion",
            "keywords": "healer enchantment death",
            "classes": {
                "Healer": "5"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "<br>\"Flesh rots, bones break, skulls sigh, spirits take let the power of my will descend on thee<br>let the power of my will restore thy spirit<br>let the power of my will knit thy corpse<br>let the power of my will give thee direction<br>let the power of my will cheat thy death<br>by the power of my will, arise my greater minion!\"",
            "m": ["Strip, Yellow"],
            "e": "<br>1. Bearer does not die or respawn as normal<br>2. Bearer is Cursed and Suppressed<br>3. When the bearer would normally die, they instead become Insubstantial and return to the caster as soon as possible. Insubstantial players may not move more than 10’ from the caster and may not speak. The caster may touch the player and then Incant “Rise and fight again” x5 to end this Insubstantial State and remove all Wounds from the player so long as no living enemies are within 10’ of the bearer<br>4. If Insubstantial is removed from the Bearer in any other manner than outlined in item 3 (or prevented entirely) this Enchantment is removed<br>5. If the caster dies, this Enchantment is removed the next time the bearer returns to the caster<br>6. If the Enchantment is removed, the bearer dies<br>7. For the duration of the Enchantment, the Caster is considered the players respawn<br>8. Dead players may be targeted by Greater Undead Minion and are immediately returned to life with all Wounds removed and the Insubstantial State applied",
            "l": "<br>1. The Insubstantial State imposed by Greater Undead Minion can be removed or prevented by any Magic or Ability which would normally be capable of removing Insubstantial or preventing Insubstantial such as Tracking, Planar Grounding, Release, or similar Magic and Abilities<br>2. This Enchantment is removed by Banish and Dimensional Rift if used on the player while they are Insubstantial<br>3. The caster may not have more than three active Greater Undead Minion and Undead Minion Enchantments combined"
        },

        "harden": {
            "name": "Harden",
            "keywords": "healer warrior enchantment protection",
            "classes": {
                "Healer": "1",
                "Warrior": "2"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with Harden\" x3",
            "m": ["Strip, White"],
            "e": "Bearers weapons or shield may only be destroyed by Magic Balls/Verbals which destroy objects e.g. Fireball or Pyrotechnics",
            "l": "Will only affect either the weapons or the shield of the bearer, not both"
        },

        "heal": {
            "name": "Heal",
            "keywords": "druid healer monk paladin scout verbal spirit heal",
            "classes": {
                "Druid": "2",
                "Healer": "1",
                "Monk": "1",
                "Paladin": "2",
                "Scout": "1"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Touch",
            "i": "<br>Sword Cut, spear stab, mace smash, arrow jab,<br>Let the white light of healing descend on thee<br>Let the white light of healing stop thy spilling blood<br>Let the white light of healing mend thy bones<br>Let the white light of healing close thy wounds<br>Let the white light of healing restore thy vigor<br>The white light of healing hath healed thee",
            "e": "Target player heals a Wound"
        },

        "heartoftheswarm": {
            "name": "Heart of the Swarm",
            "keywords": "bard druid enchantment spirit",
            "classes": {
                "Bard": "5",
                "Druid": "5"
            },
            "t": "Enchantment",
            "s": "Spirit",
            "r": "Self",
            "i": "\"Let all those who oppose the hive feel the wrath of the swarm\" x3",
            "m": ["Strip, Yellow"],
            "e": "Bearer is Stopped. Any player on the bearer’s team may use the bearer as their respawn point as per the normal game rules. Players respawning at the caster do so by announcing \"My life for the swarm.\"",
            "l": "Players can not respawn at the bearer if there are living enemy players or a game objective within 20’ of the bearer"
        },

        "heatweapon": {
            "name": "Heat Weapon",
            "keywords": "druid wizard verbal flame",
            "classes": {
                "Druid": "1",
                "Wizard": "1"
            },
            "t": "Verbal",
            "s": "Flame",
            "r": "20",
            "i": "\"I call upon flame to heat that [type of weapon]\" x3",
            "e": "Target weapon may not be wielded for 30 seconds. Players who are Immune to Flame may continue to wield the weapon"
        },

        "holdperson": {
            "name": "Hold Person",
            "keywords": "assassin healer scout wizard verbal command",
            "classes": {
                "Assassin": "4",
                "Healer": "2",
                "Scout": "5",
                "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thee to stop\" x3",
            "e": "Target player becomes Stopped for 30 seconds"
        },

        "iceball": {
            "name": "Iceball",
            "keywords": "druid healer wizard ball subdual",
            "classes": {
                "Druid": "2",
                "Healer": "3",
                "Wizard": "3"
            },
            "t": "Magic Ball",
            "s": "Subdual",
            "r": "Ball",
            "i": "\"The strength of ice is mine to evoke\" x3",
            "m": ["Magic Ball, White"],
            "e": "Target player becomes Frozen for 60 seconds. Engulfing"
        },

        "icyblast": {
            "name": "Icy Blast",
            "keywords": "druid wizard verbal sorcery",
            "classes": {
                "Druid": "3",
                "Wizard": "4"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"My power makes thee frozen\" x3",
            "e": "Target player becomes Frozen for 30 seconds"
        },

        "imbuearmor": {
            "name": "Imbue Armor",
            "keywords": "druid enchantment protection armor white",
            "classes": {
                "Druid": "1"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with Imbued Armor\" x3",
            "m": ["Strip, White"],
            "e": "All armor worn by the bearer gains +1 up to the bearer’s class maximum",
            "n": "Does not apply to magic armor. A player may only benefit from one instance of Imbue Armor, or similar magic and abilities that increase Armor Points, at a time"
        },

        "imbueshield": {
            "name": "Imbue Shield",
            "keywords": "healer enchantment protection white shield",
            "classes": {
                "Healer": "4"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"This shield shall neither break or bend\" x3",
            "m": ["Strip, White"],
            "e": "Shield wielded by the player cannot be destroyed. Engulfing effects hitting the shield are ignored"
        },

        "imbueweapon": {
            "name": "Imbue Weapon",
            "keywords": "druid enchantment death red weapon",
            "classes": {
                "Druid": "6"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "\"I enchant thee to slay all foes\" x3",
            "m": ["Strip, Red"],
            "e": "Melee weapons wielded by the bearer are Wounds Kill"
        },

        "innate": {
            "name": "Innate",
            "keywords": "bard druid healer wizard meta magic",
            "classes": {
                "Bard": "2",
                "Druid": "2",
                "Healer": "2",
                "Wizard": "2"
            },
            "t": "Meta-Magic",
            "s": "Neutral",
            "i": "\"Innate\"",
            "e": "May be used to instantly Charge a single magic"
        },

        "insult": {
            "name": "Insult",
            "keywords": "bard warrior verbal command",
            "classes": {
                "Bard": "1",
                "Warrior": "1"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thy attention sirrah\" x3",
            "e": "Victim is unable to attack or cast magic at anyone other than the caster for 30 seconds. If the victim of insult is attacked or has magic cast on them by someone other than the caster, the victim of Insult becomes able to choose to attack the offending party as well"
        },

        "ironskin": {
            "name": "Ironskin",
            "keywords": "druid enchantment protection white",
            "classes": {
                "Druid": "5"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with Ironskin\" x3",
            "m": ["Strip, White"],
            "e": "Bearer is Immune to Flame and gains two points Magic Armor affected as per Ancestral Armor"
        },

        "legend": {
            "name": "Legend",
            "keywords": "bard legend",
            "classes": {
                "Bard": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Each Extension purchased gives double the uses. Example: 1/life becomes 2/life. Swift may not be purchased or used"
        },

        "lightningbolt": {
            "name": "Lightning Bolt",
            "keywords": "wizard ball flame stopped",
            "classes": {
                "Wizard": "3"
            },
            "t": "Magic Ball",
            "s": "Flame",
            "r": "Ball",
            "i": "\"The flame of storms is mine to evoke\" x3",
            "m": ["Magic Ball, Yellow"],
            "e": "A player struck is subject to an Engulfing Stopped effect for 60 seconds. In addition Lightning Bolt will have one of the following effects on the object first struck:<br>1. A weapon hit is destroyed<br>2. Armor hit with Armor Points remaining is subject to Armor Breaking<br>3. A player hit receives a Wound in that hit location"
        },

        "lost": {
            "name": "Lost",
            "keywords": "bard verbal command insubstantial",
            "classes": {
                "Bard": "5"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "20",
            "i": "\"I command thee to be lost\" x3",
            "e": "Player becomes Insubstantial and must move directly to their base. Player must end their Insubstantial State as per normal once they reach their base",
            "n": "If the Insubstantial State is ended before reaching the base, the rest of the effect is ended as well"
        },

        "lycanthropy": {
            "name": "Lycanthropy",
            "keywords": "druid enchantment death",
            "classes": {
                "Druid": "4"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "\"Stalked in the forest, too close to hide, I’ll be upon thee by the moonlight side\" x3",
            "m": ["Strip, Red", "Strip, White"],
            "e": "Bearer gains two points of magic armor. Bearer’s melee weapons are Shield Crushing. Bearer is Immune to Command"
        },

        "magicballblock": {
            "name": "Magic Ball Block",
            "keywords": "monk enchantment protection",
            "classes": {
                "Monk": "6"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "e": "layer is allowed to block Magic Balls with their weapons and hands without penalty. Any Magic Ball in motion touched by a weapon wielded or by the hand of the player is nullified",
            "n": "Engulfing effects from blocked Magic Balls do not activate"
        },

        "masshealing": {
            "name": "Mass Healing",
            "keywords": "healer enchantment spirit",
            "classes": {
                "Healer": "6"
            },
            "t": "Enchantment",
            "s": "Spirit",
            "r": "Self",
            "i": "\"Let the powers of healing flow through me\" x3",
            "m": ["Strip, Yellow", "Strip, Yellow", "Strip, Yellow", "Strip, Yellow", "Strip, Yellow"],
            "e": "Caster may Heal a player by touching them, stating \"I grant thee healing\". Bearer must remove an Enchantment strip after each use of Heal",
            "n": "Mass Healing is removed when the last strip is removed"
        },

        "mend": {
            "name": "Mend",
            "keywords": "archer bard druid healer wizard verbal sorcery",
            "classes": {
                "Archer": "2",
                "Bard": "2",
                "Druid": "1",
                "Healer": "3",
                "Wizard": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I make this item whole again\" x5",
            "e": "Destroyed item is repaired. One point of armor in one location is repaired"
        },

        "missileblock": {
            "name": "Missile Block",
            "keywords": "monk enchantment protection",
            "classes": {
                "Monk": "1"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "e": "Player is allowed to block arrows and projectiles with their weapons and hands without penalty. Any arrow or projectile in motion touched by a weapon wielded or by the hand of the player is nullified",
            "n": "Engulfing effects from blocked arrows and projectiles do not activate"
        },

        "naturalizemagic": {
            "name": "Naturalize Magic",
            "keywords": "druid enchantment sorcery red dispel",
            "classes": {
                "Druid": "6"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"I shall restore the balance\" x3",
            "m": ["Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red", "Strip, Red"],
            "e": "Bearer may cast Dispel Magic by announcing \"[Player] thou art dispelled.\" Bearer must remove an Enchantment strip after each use of Dispel Magic and the Enchantment is removed when the last strip is removed"
        },

        "necromancer": {
            "name": "Necromancer",
            "keywords": "healer",
            "classes": {
                "Healer": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "All magic purchased in the Death School becomes Charge x3. You may have a combined total of five active Greater Undead Minion and Undead Minion Enchantments",
            "l": "You may not purchase any Enchantments from the Protection School"
        },

        "persistent": {
            "name": "Persistent",
            "keywords": "healer wizard meta enchantment",
            "classes": {
                "Healer": "6",
                "Wizard": "6"
            },
            "t": "Meta-Magic",
            "s": "Neutral",
            "i": "\"Persistent\"",
            "e": "Enchantment returns with the user after respawning until it has been otherwise removed"
        },

        "phasearrow": {
            "name": "Phase Arrow",
            "keywords": "archer arrow sorcery",
            "classes": {
                "Archer": "6"
            },
            "t": "Specialty Arrow",
            "s": "Sorcery",
            "i": "\"Phase Arrow\"",
            "m": ["Arrow, Gray (Phase)"],
            "e": "This arrow does not interact with ongoing Magic or Abilities. Example: This arrow is not stopped by Stoneskin, Protection from Projectiles, and does not trigger the effects of Troll Blood, Undead Minion, Missile Block, or similar Magic or Abilities",
            "l": "This arrow does not supercede the Frozen, Insubstantial, or Out of Game States"
        },

        "phasebolt": {
            "name": "Phase Bolt",
            "keywords": "wizard ball sorcery grey",
            "classes": {
                "Wizard": "5"
            },
            "t": "Magic Ball",
            "s": "Sorcery",
            "r": "Ball",
            "i": "\"The power of sorcery is mine to evoke\" x3",
            "m": ["Magic Ball, Gray"],
            "e": "This Magic Ball does not interact with other ongoing Magic or Abilities. Example: This Magic Ball is not stopped by Stoneskin, Protection from Projectiles, and does not trigger the effects of Troll Blood, Undead Minion, Magic Ball Block, or similar Magic or Abilities. Will have one of the following effects:<br>1. A weapon hit is destroyed<br>2. Armor hit with Armor Points remaining is subject to Armor Breaking<br>3. A player hit receives a Wound in that hit location",
            "n": "Does not supercede the Frozen, Insubstantial, or Out of Game States"
        },

        "phoenixtears": {
            "name": "Phoenix Tears",
            "keywords": "healer enchantment spirit white",
            "classes": {
                "Healer": "6"
            },
            "t": "Enchantment",
            "s": "Spirit",
            "r": "Touch",
            "i": "\"May the tears of the phoenix wash over thee\" x3",
            "m": ["Strip, White", "Strip, White"],
            "e": "Enchanted player does not die as normal. When the player would otherwise die they instead remove a strip and become Frozen for 30 seconds. When the Frozen State is ended the bearer has:<br>1. All Wounds removed<br>2. All States removed that are removed by Death or Respawning<br>3. All ongoing effects with a timer are expired<br>4. All of their equipment is fully repaired<br>5. All enchantments, except those which are Persistent, are removed<br>Additionally Phoenix Tears allows you to wear an extra Enchantment from the Protection School. This extra enchantment is considered Persistent as long as Phoenix Tears is present. The additional Enchantment is not removed once Phoenix Tears is removed",
            "n": "Phoenix Tears is removed when the last strip is removed"
        },

        "pinningarrow": {
            "name": "Pinning Arrow",
            "keywords": "archer arrow sorcery stopped",
            "classes": {
                "Archer": "1"
            },
            "t": "Specialty Arrow",
            "s": "Sorcery",
            "i": "\"Pinning Arrow\"",
            "m": ["Arrow, Yellow (Pinning)"],
            "e": "A player struck by this arrow is Stopped for 30 seconds",
            "n": "Engulfing"
        },

        "planargrounding": {
            "name": "Planar Grounding",
            "keywords": "wizard verbal sorcery insubstantial",
            "classes": {
                "Wizard": "2"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"My power closes the aether to you\" x3",
            "e": "Target player has their Insubstantial State removed and may not become Insubstantial for 30 seconds. May be cast on players who are not currently Insubstantial",
            "n": "Planar Grounding causes Enchantments that automatically render their bearer Insubstantial, such as Undead Minion, to fail and be removed if they activate while Planar Grounding is in effect"
        },

        "poison": {
            "name": "Poison",
            "keywords": "anti paladin assassin druid enchantment death",
            "classes": {
                "Anti-Paladin": "2",
                "Assassin": "1",
                "Druid": "2"
            },
            "t": "Enchantment",
            "s": "Death",
            "m": ["Strip, Red"],
            "r": "Touch",
            "i": "(Assassins and Anti-Paladins must hold weapon in both hands) \"I coat these weapons with a deadly poison\" x 2",
            "e": "The next Wound dealt by the bearer in melee is Wounds Kill"
        },

        "poisonarrow": {
            "name": "Poison Arrow",
            "keywords": "archer death arrow poison",
            "classes": {
                "Archer": "1"
            },
            "t": "Specialty Arrow",
            "s": "Death",
            "i": "\"Poison Arrow\"",
            "m": ["Arrow, Green (Poison)"],
            "e": "This arrow is Wounds Kill"
        },

        "poisonglands": {
            "name": "Poison Glands",
            "keywords": "druid enchantment death",
            "classes": {
                "Druid": "5"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "\"Thou shalt secrete poison from thy venemous glands\" x3",
            "m": ["Strip, Red"],
            "e": "Bearer gains self-only Poison (ex) 1/Refresh Charge x3"
        },

        "priest": {
            "name": "Priest",
            "keywords": "healer",
            "classes": {
                "Healer": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Meta-magic may only be used on Spirit magics. All Meta-Magics purchased become 1/Life Charge x3. Heal costs zero points"
        },

        "protectionfrommagic": {
            "name": "Protection from Magic",
            "keywords": "healer wizard enchantment protection white magic",
            "classes": {
                "Healer": "6",
                "Paladin": "6",
                "Wizard": "6"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with protection from magic\" x3",
            "m": ["Strip, White"],
            "e": "Bearer is Immune to magic from any school. Upon death the player is Cursed"
        },

        "protectionfromprojectiles": {
            "name": "Protection from Projectiles",
            "keywords": "healer enchantment protection projectile",
            "classes": {
                "Healer": "4"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"I enchant thee with Protection from Projectiles\" x3",
            "m": ["Strip, White"],
            "e": "Bearer is unaffected by ammunition, thrown javelins, rocks, and throwing weapons. Engulfing effects from those objects, such as Pinning Arrow, do not affect the player"
        },

        "pyrotechnics": {
            "name": "Pyrotechnics",
            "keywords": "wizard verbal flame",
            "classes": {
                "Wizard": "5"
            },
            "t": "Verbal",
            "s": "Flame",
            "r": "50",
            "i": "\"I call upon the element of flame to destroy thy belongings\" x3",
            "e": "All shields and weapons carried or worn by the target player are destroyed",
            "l": "Only affects shields and weapons carried or worn when the Verbal is completed"
        },

        "ranger": {
            "name": "Ranger",
            "keywords": "druid ranger",
            "classes": {
                "Druid": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "The cost of all available Equipment is reduced to zero points. May use bows so long as a shield is not carried. The cost of all Enchantments is doubled"
        },

        "ravage": {
            "name": "Ravage",
            "keywords": "wizard verbal death",
            "classes": {
               "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"Death shall ravage thy flesh and make thee fragile\" x3",
            "e": "Target player is Fragile"
        },

        "regeneration": {
            "name": "Regeneration",
            "keywords": "druid enchantment spirit yellow heal",
            "classes": {
                "Druid": "3"
            },
            "t": "Enchantment",
            "s": "Spirit",
            "r": "Touch",
            "i": "\"I grant thee the power of regeneration\" x3",
            "m": ["Strip, Yellow"],
            "e": "Bearer gains unlimited use of Swift Heal (self-only)",
            "l": "The Heal granted by Regeneration may not be used within 10’ of a living enemy"
        },

        "release": {
            "name": "Release",
            "keywords": "bard druid healer scout wizard verbal sorcery",
            "classes": {
                "Bard": "1",
                "Druid": "2",
                "Healer": "1",
                "Scout": "2",
                "Wizard": "2"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"From thy bindings thou art released\" x5",
            "e": "A single ongoing effect or State is removed from the target. Casters choice",
            "l": "Cannot remove Cursed"
        },

        "reload": {
            "name": "Reload",
            "keywords": "archer verbal sorcery out of game",
            "classes": {
                "Archer": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"I nocked my arrows to my bow, I let them fly, my quiver is low. Now I pause to go reload.\" x3",
            "e": "Player becomes Out of Game and may move about the field retrieving their arrows",
            "l": "Must stay at least 10' away from other players at all times. The player may only remove their Out of Game state in the location they started by stating, \"I return with a full quiver\" x3",
            "n": "May ask reeve for assistance in retrieving arrows that are within 10' of other players"
        },

        "restoration": {
            "name": "Restoration",
            "keywords": "bard verbal sorcery",
            "classes": {
                "Bard": "4"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I restore thee to thy full potency\"",
            "e": "Player has all uses of their per-life Magic and Abilities restored",
            "l": "Does not function on Empower, Confidence, Restoration, or similar Magic and Abilities. May not be used on the caster"
        },

        "resurrect": {
            "name": "Resurrect",
            "keywords": "druid healer monk paladin verbal spirit heal",
            "classes": {
                "Druid": "5",
                "Healer": "3",
                "Monk": "5",
                "Paladin": "4"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Touch",
            "i": "<br>Sword Cut, spear stab, mace smash, arrow jab,<br>Let the white light of healing descend on thee<br>Let the white light of healing stop thy spilling blood<br>Let the white light of healing mend thy bones<br>Let the white light of healing close thy wounds.<br>Let the white light of healing restore thy vigor.<br>The white light of healing hath resurrected thee.",
            "e": "Target Dead player is returned to life. Non-Persistent Enchantments on the player are removed before the player returns to life. Any Wounds on the player are healed"
        },

        "sanctuary": {
            "name": "Sanctuary",
            "keywords": "monk verbal protection",
            "classes": {
                "Monk": "3"
            },
            "t": "Verbal",
            "s": "Protection",
            "r": "Self",
            "i": "State \"Sanctuary\" without any weapons in hand",
            "e": "Player and their equipment is unaffected by hostile actions originating from within 20’. Must Chant \"sanctuary\"",
            "l": "Player may not carry any weapons in hand during Sanctuary. Cannot carry nor affect game items or game objectives while in Sanctuary. Players in Sanctuary may not impede the play of other people in any manner, and must immediately remove themselves from any such situations they find themselves in. May not come within 20’ of a non-friendly base",
            "n": "If the player is voluntarily touching (other than blocking) or carrying weapons in any fashion (tucked under arms, tied to thongs, etc) at any point during Sanctuary then they may only end Sanctuary within 20’ of a friendly base. Player is still susceptible to Phase Bolt and Phase Arrow"
        },

        "scavenge": {
            "name": "Scavenge",
            "keywords": "warrior verbal sorcery",
            "classes": {
                "Warrior": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"Scavenge\"",
            "e": "Repair one point of armor in one location, a shield, or a weapon",
            "l": "May only be used within 30 seconds of killing an enemy in melee combat or causing the activation of any effects which allow the player struck to avoid death such as Undead Minion, Song of Survival, or other similar magic and abilities. May not be used within 10’ of a living enemy",
            "n": "May only be used by the player striking the final blow and only once per kill per eligible enemy"
        },

        "severspirit": {
            "name": "Sever Spirit",
            "keywords": "healer verbal spirit",
            "classes": {
                "Healer": "2"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "20",
            "i": "\"The spirits lay a curse on thee.\" x3",
            "e": "May only target dead players. Player is Cursed. Any Enchantments on the player are removed"
        },

        "shadowstep": {
            "name": "Shadow Step",
            "keywords": "assassin scout verbal sorcery insubstantial",
            "classes": {
                "Assassin": "1",
                "Scout": "3"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Self",
            "i": "\"I step into the shadows\"",
            "e": "Player becomes Insubstantial"
        },

        "shakeitoff": {
            "name": "Shake It Off",
            "keywords": "warrior verbal spirit",
            "classes": {
                "Warrior": "5"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Self",
            "i": "\"I shall overcome\"",
            "e": "Shake It Off may be activated at any time the player is alive, even while the player would otherwise be prevented from activating abilities by Stunned, Suppressed, or similar. 10 seconds after activating Shake It Off the player may remove from themselves one State or effect of their choice which was present at the time they activated the ability"
        },

        "shatter": {
            "name": "Shatter",
            "keywords": "wizard verbal sorcery frozen",
            "classes": {
                "Wizard": "4"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"My power shatters thy body\" x3",
            "e": "Target Frozen player dies"
        },

        "shatterweapon": {
            "name": "Shatter Weapon",
            "keywords": "wizard verbal sorcery",
            "classes": {
                "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"My power destroys thy [type of weapon]\" x3",
            "e": "Target weapon is destroyed"
        },

        "shove": {
            "name": "Shove",
            "keywords": "bard healer wizard verbal sorcery stopped",
            "classes": {
                "Bard": "1",
                "Healer": "2",
                "Wizard": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"My power shoves thee\" x3",
            "e": "Target player is moved back 20’. Works on Stopped players"
        },

        "silvertongue": {
            "name": "Silver Tongue",
            "keywords": "bard enchantment sorcery swift yellow",
            "classes": {
                "Bard": "6"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Self or Touch",
            "i": "\"The seething sea ceaseth and thus the seething sea sufficeth us\" x2",
            "m": ["Strip, Yellow"],
            "e": "Bearer gains Swift 1/refresh Charge x3. Swift may still only be used on eligible magic. Other sources of Swift may not be utilized while Silver Tongue is worn",
            "n": "Does not use up any purchased instances of Swift"
        },

        "sleightofmind": {
            "name": "Sleight of Mind",
            "keywords": "bard enchantment sorcery",
            "classes": {
                "Bard": "4"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"May thy power remain\" x3",
            "m": ["Strip, Yellow"],
            "e": "Enchantments worn by the bearer, other than Sleight of Mind, are not removed by Dispel Magic or similar Magic and Abilities. Does not count towards the bearer’s Enchantment Limit"
        },

        "sniper": {
            "name": "Sniper",
            "keywords": "archer sorcery",
            "classes": {
                "Archer": "6"
            },
            "t": "Neutral",
            "s": "Sorcery",
            "e": "Player may physically carry any number of Specialty Arrows of each type. The frequency of each type of Specialty Arrow Ability becomes 1/Life Charge x3",
            "l": "May not fire normal arrows. Only one type of Specialty Arrow may be charged at any given time"
        },

        "songofbattle": {
            "name": "Song of Battle",
            "keywords": "bard enchantment song command",
            "classes": {
                "Bard": "2"
            },
            "t": "Enchantment",
            "s": "Command",
            "r": "Self",
            "i": "\"I sing of my legendary prowess\"",
            "m": "No strip required",
            "e": "Bearer’s weapons are Armor Breaking. Bearer must Chant \"Song of Battle\" or sing a song regarding their martial prowess. Singing in place of the normal Chant is still a Chant and must follow all Chant rules"
        },

        "songofdeflection": {
            "name": "Song of Deflection",
            "keywords": "bard enchantment protection song deflection",
            "classes": {
                "Bard": "4"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing of my nimble acrobatics\"",
            "m": "No strip required",
            "e": "Bearer does not receive Wounds from ammunition, thrown javelins, rocks, and throwing weapons. Bearer must Chant \"Song of Deflection\" or sing a song regarding their acrobatic prowess. Singing in place of the normal Chant is still a Chant and must follow all Chant rules"
        },

        "songofdetermination": {
            "name": "Song of Determination",
            "keywords": "bard enchantment protection song determination",
            "classes": {
                "Bard": "1"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing of my unwavering determination\"",
            "m": "No strip required",
            "e": "Bearer is Immune to Command. Bearer must Chant \"Song of Determination\" or sing a song regarding their determination. Singing in place of the normal Chant is still a Chant and must follow all Chant rules."
        },    

        "songoffreedom": {
            "name": "Song of Freedom",
            "keywords": "bard enchantment protection song freedom",
            "classes": {
                "Bard": "3"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing of my unquenchable wanderlust\"",
            "m": "No strip required",
            "e": "Bearer can not receive the States Stopped, Frozen, or Insubstantial unless caused by the bearer or other enchantments they carry. Bearer must Chant \"Song of Freedom\" or sing a song of roving or rambling. Singing in place of the normal Chant is still a Chant and must follow all Chant rules"
        },

        "songofinterference": {
            "name": "Song of Interference",
            "keywords": "bard enchantment protection song interference",
            "classes": {
                "Bard": "6"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing a song of dark magic thwarted\"",
            "m": "No strip required",
            "e": "As per Enlightened Soul. Bearer must Chant \"Song of Interference\" or sing a song about defeating/resisting the forces of magic. Singing in place of the normal Chant is still a Chant and must follow all Chant rules"
        },

        "songofpower": {
            "name": "Song of Power",
            "keywords": "bard enchantment protection song power",
            "classes": {
                "Bard": "4"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing to inspire my brothers-in-arms\"",
            "m": "No strip required",
            "e": "Friendly players within 20’ of the bearer have their Charging Incantation repetitions divided by 2, rounded down. Bearer is Stopped. Bearer must Chant \"Song of Power\" or sing an inspiring song. Singing in place of the normal Chant is still a Chant and must follow all Chant rules"
        },  


        "songofsurvival": {
            "name": "Song of Survival",
            "keywords": "bard enchantment protection song survival",
            "classes": {
                "Bard": "5"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing of my numerous close calls\"",
            "m": "No strip required",
            "e": "When the bearer would otherwise die, they instead announce \"Song of Survival\" and become Insubstantial. The caster treats the triggering event as though it had no effect on them other than triggering Song of Survival. Bearer may choose to return directly to their respawn location immediately after Song of Survival activates. Bearer must Chant \"Song of Survival\" or sing a song regarding their many escapes from certain doom",
            "l": "Once Song of Survival has activated to protect the bearer it may not be cast again on the same life. Singing in place of the normal Chant is still a Chant and must follow all Chant rules"
        },

        "songofvisit": {
            "name": "Song of Visit",
            "keywords": "bard enchantment protection song visit",
            "classes": {
                "Bard": "2"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"I sing to entertain friend and foe\" x3",
            "m": "No strip required",
            "e": "Bearer cannot be Wounded and is Immune to all schools. Bearer is Stopped. Bearer must Chant \"Song of Visit\" or sing a song regarding their general good nature and friendly disposition. Singing in place of the normal Chant is still a Chant and must follow all Chant rules. Song of Visit ending results in the player becoming insubstantial, and the player must return to base to end their insubstantial state and resume play",
            "l": "Bearer may not wield weapons, interact with game objects, impede play, or target any player",
            "n": "This Enchantment can be removed by Dispel Magic and similar Magic and Abilities"
        },

        "sphereofannihilation": {
            "name": "Sphere of Annihilation",
            "keywords": "wizard ball sorcery annihilation",
            "classes": {
                "Wizard": "6"
            },
            "t": "Magic Ball",
            "s": "Sorcery",
            "r": "Ball",
            "i": "\"The power of void is mine to evoke\" x3",
            "m": ["Magic Ball, Black"],
            "e": "Sphere of Annihilation will have one of the following effects on the object first struck:<br>1. A weapon hit is destroyed<br>2. A shield hit is subject to Shield Destroying<br>3. A player hit dies and is Cursed",
            "n": "Ignores armor. Enchantments which affect equipment, such as Imbue Shield or Harden, do not function against Sphere of Annihilation"
        },

        "steallifeessence": {
            "name": "Steal Life Essence",
            "keywords": "anti paladin healer wizard verbal death charge",
            "classes": {
                "Anti-Paladin": "3",
                "Healer": "5",
                "Wizard": "5"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "Touch",
            "i": "\"Steal Life\"",
            "e": "Caster may heal a Wound or instantly Charge an ability",
            "l": "May only be used on a dead player. That player is Cursed. Does not work on Cursed players"
        },

        "stoneform": {
            "name": "Stoneform",
            "keywords": "druid verbal protection frozen",
            "classes": {
                "Druid": "2"
            },
            "t": "Verbal",
            "s": "Protection",
            "r": "Self",
            "i": "\"I take the form of stone\"",
            "e": "Caster is Frozen. May end this State at any time by saying \"the earth release me\""
        },

        "stoneskin": {
            "name": "Stoneskin",
            "keywords": "druid verbal protection frozen",
            "classes": {
                "Druid": "3"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"May nature protect thee from all forms of attack\" x3",
            "m": ["Strip, White"],
            "e": "Bearer gains 2 points of Magic armor affected as per Ancestral Armor"
        },

        "stun": {
            "name": "Stun",
            "keywords": "bard healer verbal sorcery stunned",
            "classes": {
                "Bard": "6",
                "Healer": "6"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"By the power of white light I stun thee\" x3",
            "e": "Target player is Stunned for 30 seconds"
        },

        "summondead": {
            "name": "Summon Dead",
            "keywords": "healer verbal spirit",
            "classes": {
                "Healer": "2"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "50",
            "i": "\"I summon thy corpse\" x5",
            "e": "Target dead player may choose to go to the caster and then counts as though they had not moved from where they died. May be used on a dead player who has not moved from where they died or who is at their respawn location"
        },

        "summoner": {
            "name": "Summoner",
            "keywords": "druid",
            "classes": {
                "Druid": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Each Enchantment purchased gives double the uses. Example: 1/Life Charge x3 becomes 2/life Charge x3, 2/ life becomes 4/life",
            "l": "May not purchase Verbals with a range other than Touch or Self. May not purchase equipment beyond 2nd level"
        },

        "suppressaura": {
            "name": "Suppress Aura",
            "keywords": "bard wizard verbal command suppressed",
            "classes": {
                "Bard": "4",
                "Wizard": "4"
            },
            "t": "Verbal",
            "s": "Command",
            "r": "50",
            "i": "\"I command thee powerless\" x3",
            "e": "Target is Suppressed for 30 seconds"
        },

        "suppressionarrow": {
            "name": "Suppression Arrow",
            "keywords": "archer arrow sorcery suppression",
            "classes": {
                "Archer": "4"
            },
            "t": "Specialty Arrow",
            "s": "Sorcery",
            "i": "\"Suppression Arrow\"",
            "m": ["Arrow, Purple (Suppression)"],
            "e": "A player struck by this arrow is Suppressed for 30 seconds",
            "n": "Engulfing"
        },

        "suppressionbolt": {
            "name": "Suppression Bolt",
            "keywords": "wizard ball subdual suppression",
            "classes": {
                "Wizard": "2"
            },
            "t": "Magic Ball",
            "s": "Subdual",
            "r": "Ball",
            "i": "\"The strength of suppression is mine to evoke\" x3",
            "m": ["Magic Ball, Purple"],
            "e": "Target is Suppressed for 60 seconds. Engulfing"
        },

        "swift": {
            "name": "Swift",
            "keywords": "bard druid healer wizard meta magic",
            "classes": {
                "Bard": "4",
                "Druid": "4",
                "Healer": "4",
                "Wizard": "4"
            },
            "t": "Meta-Magic",
            "s": "Neutral",
            "i": "\"Swift\"",
            "e": "Magic and abilities require only a single iteration of the incantation. For multi-line Incantations use the last line",
            "l": "May only be used on Magic and Abilities at a range of Ball, Touch, or Self. May not be used on the Charge incantation"
        },

        "teleport": {
            "name": "Teleport",
            "keywords": "assassin druid healer wizard verbal sorcery insubstantial",
            "classes": {
                "Assassin": "5",
                "Druid": "4",
                "Healer": "4",
                "Wizard": "2"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"I travel through the aether\" x5",
            "e": "Player becomes Insubstantial and moves directly to a location chosen at the time of casting by the caster. Upon arrival, they must immediately end the effect as per Insubstantial",
            "n": "If the player’s Insubstantial state is removed before they have reached their destination, the effects of Teleport end"
        },

        "terror": {
            "name": "Terror",
            "keywords": "bard verbal death",
            "classes": {
                "Bard": "4"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"Death makes thee terrified\" x3",
            "e": "Target may not attack or cast magic at the caster. Target must remain at least 50’ away from the caster unless forced there by another Magic or Ability. Lasts 30 seconds",
            "n": "If the caster attacks or begins casting another magic at the target, this spell’s effect is negated"
        },

        "throw": {
            "name": "Throw",
            "keywords": "wizard verbal sorcery",
            "classes": {
                "Wizard": "3"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"My power throws thee\" x3",
            "e": "Target player is moved back 50’. Works on Stopped players"
        },

        "tracking": {
            "name": "Tracking",
            "keywords": "scout verbal sorcery insubstantial",
            "classes": {
                "Scout": "1"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "20",
            "i": "\"Tracking\" x3",
            "e": "Target Insubstantial player immediately has their Insubstantial effect ended"
        },

        "trollblood": {
            "name": "Troll Blood",
            "keywords": "druid enchantment protection white frozen",
            "classes": {
                "Druid": "5"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Touch",
            "i": "\"The blood of the trolls sustains thee\" x3",
            "m": ["Strip, White", "Strip, White", "Strip, White"],
            "e": "Enchanted player does not die as normal. When the player would otherwise die they instead ignore the triggering effect as though it had not occurred, remove a strip, and become Frozen for 30 seconds. The bearer is treated as though they have the effects of Regeneration in addition to the above",
            "n": "Troll Blood is removed when the last strip is removed"
        },

        "truegrit": {
            "name": "True Grit",
            "keywords": "warrior verbal spirit frozen",
            "classes": {
                "Warrior": "1"
            },
            "t": "Verbal",
            "s": "Spirit",
            "r": "Self",
            "i": "\"The wicked flee when I pursue\" immediately after dying",
            "e": "Player returns to life with their Wounds healed and is immediately Frozen for 30 seconds. Non-Persistent Enchantments on the player are removed before the player returns to life"
        },

        "undeadminion": {
            "name": "Undead Minion",
            "keywords": "anti paladin healer enchantment death",
            "classes": {
                "Anti-Paladin": "6",
                "Healer": "3"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "<br>Flesh rots, bones break, skulls sigh, spirits take let the power of my will descend on thee<br>let the power of my will restore thy spirit<br>let the power of my will knit thy corpse<br>let the power of my will give thee direction<br>let the power of my will cheat thy death<br>by the power of my will, arise my minion!",
            "m": ["Strip, Yellow"],
            "e": "<br>1. Bearer does not die or respawn as normal<br>2. Bearer is Cursed, Fragile, and Suppressed<br>3. When the bearer would normally die, they instead become Insubstantial and return to the caster as soon as possible. Insubstantial players may not move more than 10’ from the caster and may not speak. The caster may touch the player and then Incant “Rise and fight again” x10 to end this Insubstantial State and remove all Wounds from the player so long as no living enemies are within 10’ of the bearer<br>4. If Insubstantial is removed from the Bearer in any other manner than outlined in item 3 (or prevented entirely) this Enchantment is removed<br>5. If the caster dies, this Enchantment is removed the next time the bearer returns to the caster<br>6. If the Enchantment is removed, the bearer dies<br>7. For the duration of the Enchantment, the Caster is considered the players respawn<br>8. Dead players may be targeted by Undead Minion and are immediately returned to life with all Wounds removed and the Insubstantial State applied",
            "l": "<br>1. The Insubstantial State imposed by Undead Minion can be removed or prevented by any Magic or Ability which would normally be capable of removing Insubstantial or preventing Insubstantial such as Tracking, Planar Grounding, Release, or similar Magic and Abilities<br>2. This Enchantment is removed by Banish and Dimensional Rift if used on the player while they are Insubstantial<br>3. The caster may not have more than three active Greater Undead Minion and Undead Minion Enchantments combined"
        },

        "vampirism": {
            "name": "Vampirism",
            "keywords": "wizard enchantment death",
            "classes": {
                "Wizard": "4"
            },
            "t": "Enchantment",
            "s": "Death",
            "r": "Touch",
            "i": "\"Thy hunger can never be sated\" x3",
            "m": ["Strip, White", "Strip, Yellow"],
            "e": "Player gains Adrenaline unlimited (ex), is Immune to Death, and is Cursed. Bearer’s Adrenaline ability will work through their Cursed State"
        },

        "voidtouched": {
            "name": "Void Touched",
            "keywords": "wizard enchantment sorcery",
            "classes": {
                "Wizard": "5"
            },
            "t": "Enchantment",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"Embrace the old ones and surrender thyself\" x3",
            "m": ["Strip, Red", "Strip, White"],
            "e": "Melee weapons wielded by bearer are Armor Breaking. Bearer may use Shadow Step 1/Refresh Charge x30 (ex), Steal Life Essence unlimited (ex), and is Immune to magic from the Sorcery, Spirit, and Death Schools. May still benefit from their own Steal Life Essence. Player is Cursed"
        },

        "wardself": {
            "name": "Ward Self",
            "keywords": "wizard enchantment protection",
            "classes": {
                "Wizard": "5"
            },
            "t": "Enchantment",
            "s": "Protection",
            "r": "Self",
            "i": "\"The power of magic defends me\" x3",
            "m": ["Strip, White"],
            "e": "Resistant to the next effect which would inflict a Wound, Death, or State. Does not trigger against effects cast by the player"
        },

        "warder": {
            "name": "Warder",
            "keywords": "healer",
            "classes": {
                "Healer": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Each Enchantment purchased in the Protection School gives double the uses. Example: 1/Life Charge x3 becomes 2/life Charge x3, 2/life becomes 4/life",
            "l": "Player may not purchase any magic from the Death, Command, or Subdual Schools"
        },

        "warlock": {
            "name": "Warlock",
            "keywords": "wizard",
            "classes": {
                "Wizard": "6"
            },
            "t": "Neutral",
            "s": "Neutral",
            "e": "Each Verbal purchased in the Death and Flame Schools gives double the uses. Example: 1/Life Charge x3 becomes 2/life Charge x3, 2/life becomes 4/life",
            "l": "Player may not purchase Verbals from any School other than the Death and Flame Schools"
        },

          "wordofmending": {
            "name": "Word of Mending",
            "keywords": "druid wizard verbal sorcery",
            "classes": {
                "Druid": "6",
                "Wizard": "6"
            },
            "t": "Verbal",
            "s": "Sorcery",
            "r": "Touch",
            "i": "\"Spedoinkle\"",
            "e": "All equipment carried by target player is repaired. All armor worn by target player is restored to full value",
            "l": "May not be cast within 20’ of a living enemy"
        },

        "wounding": {
            "name": "Wounding",
            "keywords": "wizard verbal death",
            "classes": {
                "Wizard": "4"
            },
            "t": "Verbal",
            "s": "Death",
            "r": "20",
            "i": "\"Death strikes off thy [left/right] [arm/leg]\" x3",
            "e": "Target hit location on target player is Wounded",
            "l": "Has no effect on players already Wounded"
        }
    };}
    
    {classXML = `<xml>
    <classList id="Archer">
        <level points="2">
            <abilityEntry abilityName="Reload" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Destruction Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Pinning Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Poison Arrow" cost="1" per="Arrow"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Mend" per="Life"></abilityEntry>
        </level>
        <level points="2">
            <abilityEntry abilityName="Destruction Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Pinning Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Poison Arrow" cost="1" per="Arrow"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Suppression Arrow" per="Arrow"></abilityEntry>
        </level>
        <level points="2">
            <abilityEntry abilityName="Destruction Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Pinning Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Poison Arrow" cost="1" per="Arrow"></abilityEntry>
        </level>
        <level points="1">
            <abilityEntry abilityName="Phase Arrow" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Sniper" cost="1" max="0"></abilityEntry>
        </level>
        <level points="1">
            <abilityEntry abilityName="Destruction Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Pinning Arrow" cost="1" per="Arrow"></abilityEntry>
            <abilityEntry abilityName="Poison Arrow" cost="1" per="Arrow"></abilityEntry>
        </level>
    </classList>
    <classList id="Assassin">
        <level>
            <abilityEntry name="Shadow Step (Ambulant)" abilityName="Shadow Step" count="2" per="Life"></abilityEntry>
            <abilityEntry name="Assassinate (Ambulant)" abilityName="Assassinate" per="Unlimited"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Poison (self-only)" abilityName="Poison" count="1" per="Life" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Blink (Ambulant)" abilityName="Blink" count="2" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Hold Person" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Teleport (self-only)" abilityName="Teleport" count="2" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Coup de Grace" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Poison (self-only)" abilityName="Poison" count="1" per="Life"></abilityEntry>
        </level>
    </classList>
    <classList id="Barbarian">
        <level>
            <abilityEntry abilityName="Berserk"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Fight After Death (Ambulant)" abilityName="Fight After Death" count="1" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Adrenaline" per="Unlimited"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Fight After Death (Ambulant)" abilityName="Fight After Death" count="1" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Brutal Strike (Ambulant)" abilityName="Brutal Strike" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Blood and Thunder" count="2" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Blood and Thunder" count="1" per="Refresh"></abilityEntry>
        </level>
    </classList>
    <classList id="Monk">
        <level>
            <abilityEntry abilityName="Enlightened Soul"></abilityEntry>
            <abilityEntry abilityName="Missile Block"></abilityEntry>
        </level>
        <level>
        </level>
        <level>
            <abilityEntry name="Sanctuary (Ambulant)" abilityName="Sanctuary" count="1" per="Life" charge="5"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Heal (self-only)" abilityName="Heal" count="1" per="Life" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Resurrect" count="1" per="Refresh" charge="10"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Magic Ball Block"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Heal (self-only)" abilityName="Heal" count="1" per="Life"></abilityEntry>
        </level>
    </classList>
    <classList id="Scout">
        <level>
            <abilityEntry name="Tracking (Ambulant)" abilityName="Tracking" count="2" per="Life" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Heal" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Release" count="1" per="Life" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Shadow Step" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Dispel Magic" count="1" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Evolution"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Hold Person" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Adaptive Blessing (self-only)" abilityName="Adaptive Blessing" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Heal" count="1" per="Life"></abilityEntry>
        </level>
    </classList>
    <classList id="Warrior">
        <level>
            <abilityEntry abilityName="Scavenge" per="Unlimited"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Harden" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="True Grit" count="1" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Insult (Ambulant)" abilityName="Insult" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Shake It Off" count="1" per="Refresh" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Ancestral Armor (Swift)" abilityName="Ancestral Armor" count="3" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Insult (Ambulant)" abilityName="Insult" count="1" per="Life"></abilityEntry>
        </level>
    </classList>
    <classList id="Bard" magic-user="true">
        <level points="5">
            <abilityEntry abilityName="Cancel" cost="0" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Confidence" cost="1" count="1" per="Refresh" charge="5"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Short" cost="2" max="2"></abilityEntry>
            <abilityEntry abilityName="Experienced" cost="2" max="2"></abilityEntry>
            <abilityEntry abilityName="Insult" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Release" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Shove" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Song of Determination" cost="1" max="1" per="Unlimited"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Empower" cost="1" count="2" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Equipment: Armor, 1 Point" cost="4" max="1"></abilityEntry>
            <abilityEntry abilityName="Greater Release" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Innate" cost="1" max="4" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Mend" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Song of Battle" cost="1" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Song of Visit" cost="1" max="1" per="Unlimited"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Awe" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Battlefield Triage" cost="1" max="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Break Concentration" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Extension" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Equipment: Shield, Small" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Song of Freedom" cost="1" max="1" per="Unlimited"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Amplification" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Long" cost="3" max="1"></abilityEntry>
            <abilityEntry abilityName="Restoration" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Sleight of Mind" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Song of Deflection" cost="1" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Song of Power" cost="1" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Suppress Aura" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Swift" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Terror" cost="1" count="1" per="Refresh"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Agoraphobia" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Ambulant" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Discordia" cost="1" max="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Equipment: Shield, Medium" cost="3" max="1"></abilityEntry>
            <abilityEntry abilityName="Heart of the Swarm" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Lost" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Song of Survival" cost="1" max="1" per="Unlimited"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Combat Caster" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Dervish" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Equipment: Armor, 1 Point" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Legend" cost="1" max="1"></abilityEntry>
            <abilityEntry abilityName="Silver Tongue" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Song of Interference" cost="1" max="1" count="1" per="Refresh" charge="5"></abilityEntry>
            <abilityEntry abilityName="Stun" cost="1" count="1" per="Refresh"></abilityEntry>
        </level>
    </classList>
    <classList id="Druid" magic-user="true">
        <level points="5">
            <abilityEntry abilityName="Barkskin" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Cancel" cost="0" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Corrosive Mist" cost="1" max="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Entangle" cost="1" max="2" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Short" cost="2" max="2"></abilityEntry>
            <abilityEntry abilityName="Experienced" cost="2" max="0"></abilityEntry>
            <abilityEntry abilityName="Heat Weapon" cost="1" count="1" per="Life" charge="3"></abilityEntry>
            <abilityEntry abilityName="Imbue Armor" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Mend" cost="1" count="1" per="Life"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Equipment: Shield, Small" cost="4" max="1"></abilityEntry>
            <abilityEntry abilityName="Gift of Earth" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Heal" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Iceball" cost="1" max="2" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Innate" cost="1" max="4" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Poison" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Release" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Stoneform" cost="1" count="1" per="Refresh" charge="3"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Attuned" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Bear Strength" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Dispel Magic" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Extension" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Gift of Fire" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Greater Mend" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Icy Blast" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Regeneration" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Stoneskin" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Equipment: Weapon, Long" cost="4" max="1"></abilityEntry>
            <abilityEntry abilityName="Flame Blade" cost="2" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Force Bolt" cost="1" max="2" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Gift of Water" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Golem" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Lycanthropy" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Swift" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Teleport" cost="1" max="2" count="1" per="Life"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Ambulant" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Great" cost="5" max="1"></abilityEntry>
            <abilityEntry abilityName="Essence Graft" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Gift of Air" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Heart of the Swarm" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Ironskin" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Poison Glands" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Resurrect" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Troll Blood" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Avatar of Nature" cost="1" max="1"></abilityEntry>
            <abilityEntry abilityName="Call Lightning" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Grasping Tentacles" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Imbue Weapon" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Naturalize Magic" cost="1" max="2"></abilityEntry>
            <abilityEntry abilityName="Ranger" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Summoner" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Word of Mending" cost="1" count="1" per="Refresh"></abilityEntry>
        </level>
    </classList>
    <classList id="Healer" magic-user="true">
        <level points="5">
            <abilityEntry abilityName="Banish" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Blessing Against Wounds" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Cancel" cost="0" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Equipment: Shield, Small" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Short" cost="3" max="2"></abilityEntry>
            <abilityEntry abilityName="Experienced" cost="2" max="2"></abilityEntry>
            <abilityEntry abilityName="Harden" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Heal" cost="1" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Release" cost="1" count="2" per="Refresh" charge="3"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Adaptive Blessing" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Entangle" cost="1" max="4" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Hinged" cost="3" max="1"></abilityEntry>
            <abilityEntry abilityName="Greater Release" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Hold Person" cost="1" count="1" per="Life" charge="3"></abilityEntry>
            <abilityEntry abilityName="Innate" cost="2" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Sever Spirit" cost="1" count="1" per="Life" charge="3"></abilityEntry>
            <abilityEntry abilityName="Shove" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Summon Dead" cost="1" count="1" per="Life" charge="3"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Adaptive Protection" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Astral Intervention" cost="1" count="1" per="Life" charge="3"></abilityEntry>
            <abilityEntry abilityName="Equipment: Shield, Medium" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Extension" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Greater Harden" cost="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Iceball" cost="1" max="2" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Mend" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Resurrect" cost="1" count="1" per="Refresh" charge="5"></abilityEntry>
            <abilityEntry abilityName="Undead Minion" cost="1" count="1" per="Refresh"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Blessing Against Harm" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Circle of Protection" cost="1" max="1" count="1" per="Refresh" charge="10"></abilityEntry>
            <abilityEntry abilityName="Greater Heal" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Imbue Shield" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Protection from Projectiles" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Swift" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Teleport" cost="1" max="2" count="1" per="Life"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Abeyance" cost="1" max="2" count="1" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Ambulant" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Blessed Aura" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Dispel Magic" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Enlightened Soul" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Greater Resurrect" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Greater Undead Minion" cost="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Steal Life Essence" cost="1" max="2" count="1" per="Life"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Ancestral Armor" cost="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Mass Healing" cost="1" max="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Necromancer" cost="1" max="1"></abilityEntry>
            <abilityEntry abilityName="Persistent" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Phoenix Tears" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Priest" cost="1" max="1"></abilityEntry>
            <abilityEntry abilityName="Protection from Magic" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Stun" cost="1" max="4" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Warder" cost="2" max="1"></abilityEntry>
        </level>
    </classList>
    <classList id="Wizard" magic-user="true">
        <level points="5">
            <abilityEntry abilityName="Banish" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Cancel" cost="0" max="1" per="Unlimited"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Short" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Experienced" cost="2" max="2"></abilityEntry>
            <abilityEntry abilityName="Force Barrier" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Force Bolt" cost="1" max="4" count="3" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Heat Weapon" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Mend" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Shove" cost="1" count="1" per="Life" charge="3"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Astral Intervention" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Break Concentration" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Entangle" cost="1" max="3" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Innate" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Planar Grounding" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Release" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Suppression Bolt" cost="1" max="3" count="1" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Teleport" cost="1" max="2" count="1" per="Life"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Dispel Magic" cost="1" count="1" per="Refresh" charge="3"></abilityEntry>
            <abilityEntry abilityName="Dragged Below" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Extension" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Greater Mend" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Hold Person" cost="1" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Iceball" cost="1" max="3" count="2" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Lightning Bolt" cost="1" max="4" count="1" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Ravage" cost="1" count="2" per="Life"></abilityEntry>
            <abilityEntry abilityName="Shatter Weapon" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Throw" cost="1" count="1" per="Refresh"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Destroy Armor" cost="1" count="2" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Dimensional Rift" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Fireball" cost="1" max="4" count="1" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Icy Blast" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Shatter" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Suppress Aura" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Swift" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Vampirism" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Wounding" cost="1" count="1" per="Refresh" charge="3"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Ambulant" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Contagion" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Equipment: Weapon, Long" cost="4" max="1"></abilityEntry>
            <abilityEntry abilityName="Phase Bolt" cost="1" max="4" count="1" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Pyrotechnics" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Steal Life Essence" cost="1" max="2" count="1" per="Life"></abilityEntry>
            <abilityEntry abilityName="Void Touched" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Ward Self" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
        </level>
        <level points="5">
            <abilityEntry abilityName="Battlemage" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Elemental Barrage" cost="1" max="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Evoker" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Finger of Death" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Persistent" cost="2" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Protection from Magic" cost="1" count="1" per="Refresh"></abilityEntry>
            <abilityEntry abilityName="Sphere of Annihilation" cost="2" max="1" count="1" per="Ball"></abilityEntry>
            <abilityEntry abilityName="Warlock" cost="2" max="1"></abilityEntry>
            <abilityEntry abilityName="Word of Mending" cost="1" count="1" per="Refresh"></abilityEntry>
        </level>
    </classList>
    <classList id="Anti-Paladin">
        <level>
        </level>
        <level>
            <abilityEntry name="Poison (self-only)" abilityName="Poison" count="1" per="Refresh" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Steal Life Essence" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Brutal Strike (Ambulant)" abilityName="Brutal Strike" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Awe" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Undead Minion" count="2" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Awe" count="1" per="Life"></abilityEntry>
        </level>
    </classList>
    <classList id="Paladin">
        <level>
        </level>
        <level>
            <abilityEntry abilityName="Heal" count="1" per="Refresh" charge="3"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Extend Immunities" count="1" per="Refresh" charge="5"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Resurrect" count="2" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Awe" count="1" per="Life"></abilityEntry>
        </level>
        <level>
            <abilityEntry name="Protection from Magic (self/touch)" abilityName="Protection from Magic" count="2" per="Refresh"></abilityEntry>
        </level>
        <level>
            <abilityEntry abilityName="Awe" count="1" per="Life"></abilityEntry>
        </level>
    </classList>
    <!--
    <classList id="" magic-user="">
        <level>
            <abilityEntry abilityName="" cost="" max="" count="" per="" charge=""></abilityEntry>
        </level>
    </classList>
    -->
    </xml>`;}
}