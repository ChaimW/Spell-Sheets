var allAbilities;    //map[String: DefaultAbility]
var allArchetypes;
var allClasses;  //map[String: DefaultClass]
var allMaterials;	//map[String: String]
var allTags;

var libraries;

var currentPlayer;
var currentAbility;

var fetchJSON = function(url, onSuccess, onFail) {
	var request = new XMLHttpRequest();
	request.open('get', url, true);
	request.responseType = 'json';
	request.onload = function() {
		var status = xhr.status;
		if (request.status >= 200 && request.status < 400) {
			successHandler && successHandler(request.response);
		} else {
			errorHandler && errorHandler(request.status);
		}
	};
	request.send();
};

function preInit() {
	libraries = new Map();
	allAbilities = new Map();
	allAbilities.set("Look the Part", new DefaultAbility("Look the Part", "&#8210;"));
	allArchetypes = new Map();
	allClasses = new Map();
	allMaterials = new Map();
	allTags = new Array();
	mountLib('https://jkat718.github.io/Spell-Sheets-By-Gor/docs/rules_of_play');
	unlock();
}

function mountLib(url) {
	var libRequest = new XMLHttpRequest();
	libRequest.open('GET', url + "/lib.json");
	
	libRequest.onreadystatechange = function() {
		if (libRequest.readyState == 4) {
			if (libRequest.status >= 200 && libRequest.status < 400){
				addLib(url, JSON.parse(libRequest.responseText));
				console.log("Loaded library from " + url + "!");
			} else {
				console.warn("Could not load library. Server reached, returned status code " + libRequest.status + ".");
			}
		}
	};
	
	libRequest.onerror = function() {
		console.warn("Could not load library. Server not reached.");
	};
	
	libRequest.send();
}

function addLib(url, lib) {
	if (lib["materials"] == null) {
		//console.log("No materials to load!");
	} else {
		var materialName;
		for(var material in lib["materials"]) {
			if (allMaterials.has(material)) {
				console.warn("Duplicate material \"" + material + "\"!");
			} else {
				allMaterials.set(material, lib["materials"][material]);
				//console.log("Loaded material \"" + material + "\"!");
			}
		}
	}
	
	if (lib["abilities"] == null) {
		//console.log("No abilities to load!");
	} else {
		for(var i = 0; i < lib["abilities"].length; i++) {
			loadAbility(url, lib["abilities"][i]);
		}
	}
	
	if (lib["tags"] == null) {
		//console.log("No tags to load!");
	} else {
		var tagName;
		for(var i = 0; i < lib["tags"].length; i++) {
			tagName = lib["tags"][i];
			if (allTags.includes(tagName)) {
				console.warn("Duplicate tag \"" + tagName + "\"!");
			} else {
				allTags.push(tagName);
				//console.log("Loaded tag \"" + tagName + "\"!");
			}
		}
	}
	
	if (lib["archetypes"] == null) {
		console.log("No archetypes to load!");
	} else {
		for(var i = 0; i < lib["archetypes"].length; i++) {
			loadArchetype(url, lib["archetypes"][i]);
		}
	}
	
	if (lib["classes"] == null) {
		console.log("No classes to load!");
	} else {
		for(var i = 0; i < lib["classes"].length; i++) {
			loadClass(url, lib["classes"][i]);
		}
	}
}

function loadAbility(url, abilityName) {
	var abilityRequest = new XMLHttpRequest();
	abilityRequest.open('GET', url + "/abilities/" + abilityName + ".json");
	abilityRequest.responseType = 'json';
	
	abilityRequest.onreadystatechange = function() {
		if (abilityRequest.readyState == 4) {
			if (abilityRequest.status >= 200 && abilityRequest.status < 400){
				try {
					allAbilities.set(
						abilityName,
						new DefaultAbility(
							abilityRequest.response["name"],
							abilityRequest.response["t"],
							abilityRequest.response["s"],
							abilityRequest.response["r"],
							abilityRequest.response["m"],
							abilityRequest.response["i"],
							abilityRequest.response["e"],
							abilityRequest.response["l"],
							abilityRequest.response["n"]
						)
					)
					//console.log("Loaded ability \"" + abilityName + "\"!");
					//console.dir(allAbilities.get(abilityName));
				} catch (e) {
					console.warn("Could not load \"" + abilityName + "\". Directory file formatted improperly. Error code " + e.message);
					throw e;
				}
			} else {
				console.warn("Could not load \"" + abilityName + "\". Server reached, returned status code " + abilityRequest.status + ".");
			}
		}
	};
	
	abilityRequest.onerror = function() {
		console.warn("Could not load \"" + abilityName + "\". Server not reached.", true);
	};
	
	abilityRequest.send();
}

function loadArchetype(url, archetypeName) {
	var archetypeRequest = new XMLHttpRequest();
	archetypeRequest.open('GET', url + "/archetypes/" + archetypeName + ".json");
	archetypeRequest.responseType = 'json';
	
	archetypeRequest.onreadystatechange = function() {
		if (archetypeRequest.readyState == 4) {
			if (archetypeRequest.status >= 200 && archetypeRequest.status < 400){
				try {
					allArchetypes.set(
						archetypeName,
						archetypeRequest.response
					);
					//console.log("Loaded archetype \"" + archetypeName + "\"!");
					//console.dir(allArchetypes.get(archetypeName));
				} catch (e) {
					console.warn("Could not load \"" + archetypeName + "\". Directory file formatted improperly. Error code " + e.message);
					throw e;
				}
			} else {
				console.warn("Could not load \"" + archetypeName + "\". Server reached, returned status code " + archetypeRequest.status + ".");
			}
		}
	};
	
	archetypeRequest.onerror = function() {
		console.warn("Could not load \"" + archetypeName + "\". Server not reached.", true);
	};
	
	archetypeRequest.send();
}

function loadClass(url, className) {
	var classRequest = new XMLHttpRequest();
	classRequest.open('GET', url + "/classes/" + className + ".json");
	classRequest.responseType = 'json';
	
	classRequest.onreadystatechange = function() {
		if (classRequest.readyState == 4) {
			if (classRequest.status >= 200 && classRequest.status < 400){
				try {
					allClasses.set(
						className,
						initClass(classRequest.response)
					);
					//console.log("Loaded class \"" + className + "\"!");
					//console.dir(allClasses.get(className));
				} catch (e) {
					console.warn("Could not load \"" + className + "\". Directory file formatted improperly. Error code " + e.message);
					throw e;
				}
			} else {
				console.warn("Could not load \"" + className + "\". Server reached, returned status code " + classRequest.status + ".");
			}
		}
	};
	
	classRequest.onerror = function() {
		console.warn("Could not load \"" + className + "\". Server not reached.", true);
	};
	
	classRequest.send();
}

function initClass(classJSON) {
	var defaultClass, curClass, abilityObj, levelIndex;
	curClass = new DefaultClass(classJSON["name"], classJSON["magic-user"] != undefined && classJSON["magic-user"]);
	for (levelIndex = 0; levelIndex < 7 && levelIndex < classJSON["levels"].length; levelIndex++) {
		if (classJSON["levels"][levelIndex]["points"] != undefined) {
			curClass.levels[levelIndex].points = classJSON["levels"][levelIndex]["points"];
		}
		classJSON["levels"][levelIndex]["abilities"].forEach(function(abilityObj) {
			curClass.addAbilityEntry(
				levelIndex,
				abilityObj["name"],
				abilityObj["cost"],
				abilityObj["max"],
				abilityObj["count"],
				abilityObj["per"],
				abilityObj["charge"],
				abilityObj["tags"]
			);
		});
	}
	if (curClass.isMagicUser) {
		curClass.levels[6].points = 1;
	}
	curClass.addAbilityEntry(6, "Look the Part", 0, 1, 1, "&#8210;", 0, []);
	return curClass;
}

function unlock() {
	document.getElementById("refresh-button").disabled = false;
	
	infoRequest = new XMLHttpRequest();
	infoRequest.open('GET', "https://jkat718.github.io/Spell-Sheets-By-Gor/docs/info.txt", true);
	
	infoRequest.onreadystatechange = function() {
		if (infoRequest.readyState == 4) {
			if (infoRequest.status >= 200 && infoRequest.status < 400){
				document.getElementById("info-box").innerHTML = infoRequest.responseText;
			} else {
				document.getElementById("info-box").innerHTML = "Could not load information.";
			}
		}
	};
	
	infoRequest.send();
	
	currentPlayer = new Player(document.getElementById("select-className").value.toLowerCase(), document.getElementById("select-level").selectedIndex);
	update();
}

var unimplementedAbilityNames = ["Avatar of Nature", "Battlemage", "Dervish", "Evoker", "Experienced", "Legend", "Necromancer", "Priest", "Ranger", "Sniper", "Summoner", "Warder", "Warlock"]
function update() {
	currentPlayer.updatePoints();
	
	/*
	//console.clear();
	console.log("allAbilities");
	console.dir(allAbilities);
	console.log("allClasses");
	console.dir(allClasses);
	console.log("currentPlayer");
	console.dir(currentPlayer);
	*/
	console.log(formatPointDistributionOfPlayer(currentPlayer));

//update Current Abilities
	var curAbilElement = document.getElementById("current-abilities");
	curAbilElement.innerHTML = "";
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
						abilityEntry.name,
						abilityEntry.cost,
						abilityEntry.max,
						currentPlayer.getCountOfAbilityEntry(abilityEntry) * abilityEntry.count,
						abilityEntry.per,
						abilityEntry.charge,
						[]
					)
				);
			}
		}
	});
	var currentAbilityText;
	currentAbilities.forEach(function(newAbilityEntry, abilityEntryName) {
		currentAbilityText = "<li>";
		currentAbilityText += newAbilityEntry.ability.name;
		if (newAbilityEntry.per != "&#8210;") {
			currentAbilityText += " (";
			currentAbilityText += newAbilityEntry.shortFrequency();
			if (newAbilityEntry.ability.range != "&#8210;") {
				currentAbilityText += "@" + newAbilityEntry.ability.range;
			}
			currentAbilityText += ")";
		}
		currentAbilityText += "</li>";
		curAbilElement.innerHTML += currentAbilityText;
	});
	if (curAbilElement.innerHTML == "") {
		curAbilElement.innerHTML = "<li>&nbsp;</li>";
	}
	
//update Current Equipment
	var curEquipElement = document.getElementById("current-equipment");
	curEquipElement.innerHTML = "";
	var currentEquipmentCount, currentEquipmentText;
	allMaterials.forEach(function(curEquipmentDescription, curEquipment) {
		currentEquipmentCount = 0;
		currentAbilities.forEach(function(newAbilityEntry) {
			console.dir(newAbilityEntry.ability.materials);
			if (newAbilityEntry.ability.materials.has(curEquipment)) {
				currentEquipmentCount += newAbilityEntry.ability.materials.get(curEquipment) * newAbilityEntry.count;
			}
		});
		console.log(curEquipment);
		console.log(currentEquipmentCount);
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
			curEquipElement.innerHTML += currentEquipmentText;
		}
	});
	if (curEquipElement.innerHTML == "") {
		curEquipElement.innerHTML = "<li>&nbsp;</li>";
	}

//update Class List
	document.getElementById("class-name").innerHTML = currentPlayer.playerClass.name + ", level " + (currentPlayer.level + 1);
	var classList, curLevel;
	toArray(document.getElementById("class-list").getElementsByTagName("tbody")).forEach(function(curTBody, curLevelIndex) {
		curLevel = currentPlayer.playerClass.levels[curLevelIndex];
		while(curTBody.children.length > 1) {
			curTBody.removeChild(curTBody.lastChild);
		}
		if (curLevel.points > 0 && currentPlayer.hasLevelIndex(curLevelIndex)) {
			document.getElementById("points" + curLevelIndex).innerHTML = currentPlayer.getPointsRemainingAtLevelIndex(curLevelIndex) + "/" + curLevel.points;
		} else {
			document.getElementById("points" + curLevelIndex).innerHTML = "";
		}
		curLevel.abilityEntries.forEach(function(abilityEntry) {
			classList = "<tr><td onclick=\"setCurrentAbility(\'" + abilityEntry.name + "\')\">&nbsp;&nbsp;" + abilityEntry.ability.name + " [" + abilityEntry.tags + "]</td>";
			classList += "<td id=\"cost " + abilityEntry.name + " @ " + curLevelIndex + "\">" + abilityEntry.cost + "</td><td id=\"max " + abilityEntry.name + " @ " + curLevelIndex + "\">";
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
			curTBody.innerHTML += classList;
		});
		
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

function setCurrentAbility(abilityName) {
	if (allAbilities.get(abilityName) == undefined) {
		document.getElementById("ability-info").innerHTML = "Click an ability for more information!";
	} else {
		document.getElementById("ability-info").innerHTML = allAbilities.get(abilityName).description;
	}
}

function Player(playerClassName, level) {
	this.playerClass = allClasses.get(playerClassName);
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
	
	this.addAbilityEntry = function DefaultClass_addAbilityEntry(levelIndex, abilityName, cost, max, count, per, charge, tags) {
		if (this.indexOfAbilityName(abilityName, levelIndex) != -1) {
			print("cannot add ability entry " + abilityName + " at level index " + levelIndex);
		} else {
			var abilityEntry = new AbilityEntry(abilityName, 0, 1, 1, "&#8210;", 0, []);
			//abilityEntry.name = this.name + ": " + abilityName + "@" + (levelIndex);
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
			printObj(abilityEntry);
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

function AbilityEntry(abilityName, cost, max, count, per, charge, tags) {
	this.name = String(abilityName);
	this.ability = allAbilities.get(abilityName);
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
			return this.count + " B/U";
		} else if (this.per == "Arrow") {
			return this.count + " A/U";
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
			firstAbilityEntry.name,
			0,
			1,
			Math.max(firstAbilityEntry.count, secondAbilityEntry.count),
			"&#8210;",
			0,
			[]
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

function DefaultAbility(name, type, school, range, newMaterials, incantation, effect, limitations, notes) {
	this.name = String(name);
	this.description = "<span style=\"font-size:20px;font-weight:bold;font-variant:small-caps;\">" + this.name + "</span><br>";
	
	this.type = String(type);
	this.description += "<b>T:</b> " + this.type + "&nbsp;&nbsp;&nbsp;&nbsp;";
	
	if (school == undefined) {
		this.school = "&#8210;";
	} else {
		this.school = String(school);
		this.description += "<b>S:</b> " + this.school + "&nbsp;&nbsp;&nbsp;&nbsp;";
	}
	
	if (range == undefined) {
		this.range = "&#8210;";
	} else {
		this.range = String(range);
		this.description += "<b>R:</b> " + this.range;
	}
	
	this.description += "<br>";
	
	this.materials = new Map();
	if (newMaterials != undefined && newMaterials.length) {
		newMaterials.sort();
		for (var curEquipmentIndex in newMaterials) {
			if (this.materials.has(newMaterials[curEquipmentIndex])) {
				this.materials.set(newMaterials[curEquipmentIndex], this.materials.get(newMaterials[curEquipmentIndex]) + 1);
			} else {
				this.materials.set(newMaterials[curEquipmentIndex], 1);
			}
		}
	}
	if (this.materials.size > 0) {
		this.description += "<b>M:</b><br>";
		this.description += "<ul>";
		for (var [material, count] of this.materials) {
			this.description += "<li>";
			this.description += allMaterials.get(material);
			if (count > 1) {
				this.description += " x" + count;
			}
			this.description += "</li>";
		}
		this.description += "</ul>";
	}
	
	if (incantation != undefined) {
		this.incantation = String(incantation);
		incantation = incantation.split("&quot;");
		this.description += "<b>I:</b> " + incantation[0] + "<i>&quot;" + incantation[1] + "&quot;</i> " + incantation[2] + "<br>";
	}
	
	if (effect != undefined) {
		this.effect = String(effect);
		effect.replace("<br>", "BREAKHOLDER");
		effect = effect.split("&quot;");
		this.description += "<b>E:</b> " + effect[0];
		for (var i = 1; i < effect.length; i++) {
			if (i % 2 == 0) {
				this.description += effect[i];
			} else {
				this.description += "<i>&quot;" + effect[i] + "&quot;</i>";
			}
		}
		this.description += "<br>";
		this.description.replace("BREAKHOLDER", "<br>");
	}
	
	if (limitations != undefined) {
		this.limitations = String(limitations);
		this.description += "<b>L:</b> " + this.limitations + "<br>";
	}
	
	if (notes != undefined) {
		this.notes = String(notes);
		this.description += "<b>N:</b> " + this.notes + "<br>";
	}

	if (this.name == "Look the Part") {
		this.description = "<b>Look the Part:</b> This is an extra Ability that is available to a player only if they actively role-play or portray their class. Examples would be acting consistently in character in battlegames, having good class-specific garb, and meaningfully  contributing to the atmosphere of the game. This ability need not meet a cookie-cutter definition of the class; any dedicated behavior consistent with a backstory can work. Barbarian, for example, could be played as a refined Samurai rather than a raging viking and still qualify for the bonus. Look The Part abilities are available at first level and are in addition to all other class abilities. Example: A player has a Look The Part ability of Scavenge 1/Life and a normal class ability of Scavenge 1/Life would have Scavenge 2/life. Who qualifies for Look The Part is game-by-game bonus awarded by the group monarch or joint decision of the game reeve and the guildmaster for the class.";
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

function setStatus(infoText) {
	document.getElementById("status-box").innerHTML += "<br>" + infoText;
}

var outputMessagesFrom = ["addLib", "update", "!Player_getCostOfAbilityEntry", "!Player_getPointsRemainingAtLevelIndex", "!Player_getPointsSpentOnAbilityEntry", "!Player_addAbilityEntry", "!DefaultClass_addAbilityEntry"];

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