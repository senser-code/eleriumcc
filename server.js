const express = require("express")
const fileUpload = require("express-fileupload")
const fs = require("fs")
const app = express()
const Discord = require("discord.js")
const Bot = new Discord.Client()
const uuid = require("uuid")
const mime = require("mime")
const config = require("./config.json");
const path = require("path");
const Prefix = "."
var InviteSystem = {}
let evalAccess = ["666367959119298617"]
let Flags = {
    Invites: true
}
let Commands = {
    //["commandname"] = {callback: function() {}}
}

function AddCommand(name, callback) {
    Commands[Prefix + name] = {callback: callback}
}

InviteSystem.get = function(DiscordID) {
    let Invites = JSON.parse(fs.readFileSync("./invites.json"))
    return Invites[DiscordID] || 0
}


InviteSystem.add = function(DiscordID, Amount) {
    let Invites = JSON.parse(fs.readFileSync("./invites.json"))
    let CurrentInvites = Invites[DiscordID] || 0
    CurrentInvites = CurrentInvites + Amount
    Invites[DiscordID] = CurrentInvites
    fs.writeFileSync("./invites.json", JSON.stringify(Invites, null, "\t"))
}

InviteSystem.set = function(DiscordID, Value) {
    let Invites = JSON.parse(fs.readFileSync("./invites.json"))
    let CurrentInvites = Invites[DiscordID] || 0
    CurrentInvites = Value
    Invites[DiscordID] = CurrentInvites
    fs.writeFileSync("./invites.json", JSON.stringify(Invites, null, "\t"))
}


app.use(express.json())
app.use(fileUpload({
    limits: {fileSize: 5000 * 1024 * 1024}
}))

function GenerateString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function Typeof(Value) {
    let Type = typeof(Value)
    if (Type == "number") {
        return isNaN(Value) && "undefined" || "number"
    } else {
        return Type
    }
}



function Embed(text, desc, objects) {
    var data = new Discord.MessageEmbed()
    data.setColor(0x0EBFE9)
    data.setTitle(text)
    data.setDescription(desc) 
    if (objects) {
        let List = []
        Object.keys(objects).forEach(function(Key) {
            List.push({name: Key, value: objects[Key]})
        })
        data.addFields(List)
    }
    return data
}

app.set('view engine', 'ejs')



function getDomain(domain) {
    let Cards = domain.split(".")
    if (Cards.length == 3) {
        Cards.splice(0, 1)
        return [Cards.join("."), true]
    } else {
        return [domain, false]
    }
}



app.get("/discord", function(req, res) {
    return res.redirect("https://discord.gg/dR5RwkR")
})

app.get("/config", function(req, res) {
    if (req.query.key) {
        let Config = {
            "Version": "12.4.0",
            "Name": "elerium.cc",
            "DestinationType": "ImageUploader, TextUploader, FileUploader",
            "RequestMethod": "POST",
            "RequestURL": `${config.defaultDomain}/upload`,
            "Body": "MultipartFormData",
            "Arguments": {
                "key": req.query.key
            },
            "FileFormName": "fdata"
        }

        res.setHeader('Content-type', "application/octet-stream")
        res.setHeader('Content-disposition', 'attachment; filename=uploader.sxcu')
        return res.send(JSON.stringify(Config, null, "  "))
    } else {
        return res.end("Key is required")
    }
})




app.get("/:file", function(req, res) {
    if (req.params.file.split(".")[1] == "html") {
        res.set("Content-Type", "text/plain")
    }
    res.status(200).sendFile(__dirname + "/uploads/" + req.params.file, {}, function(err) {
        if (err) {
            res.status(404).end("Not found")
        }
        if (req.headers["x-forwarded-host"] == "elerium.cc") {
            return res.status(405).end("Not allowed")
        }
    })
})

app.post("/upload", async function(req, res) {
    const Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
    const VaildDomains = JSON.parse(fs.readFileSync("config.json", {encoding: "utf8"})).VaildDomains
    if (!req.files.fdata) {
        return res.status(500).end("fdata is required")
    }
    if (!req.body.key) return res.status(500).end("Key is required")
    const File = req.files.fdata
    const FileDots = File.name.split(".")
    const FileName = `${GenerateString(8)}${path.extname(File.name)}`;
    let allowedlist = [
        "video",
        "image"
    ]
    const ParsedMimeType = mime.getType(File.name).split("/")
    const DomainToShow = req.body.domain || "unverified-ape.xyz"
    if (Keys.includes(req.body.key)) {
        await File.mv("./uploads/" + FileName)
        let Location = (req.body.discord_embed && allowedlist.includes(ParsedMimeType[0]) || false) && "/" || "/raw/"
        res.end(`https://${DomainToShow}${Location}${FileName}`)
    } else {
        res.status(401).end("Invaild Key")
    }
})


function GetServer() {
    return Bot.guilds.cache.get("714790676524564520")
}


function GetUsers() {
    let Data = JSON.parse(fs.readFileSync("userinfo.json"))
    return Data
}


Bot.on("guildMemberAdd", function(member) {
    if (member.guild.id == GetServer().id) {
        let DiscordID = member.id
        var Whitelisted = false
        var UploadKey = ""
        let Users = GetUsers()
        for (Key in Users) {
            if (Users[Key].DiscordId == DiscordID) {
                Whitelisted = true
                UploadKey = Key
                break
            }
        }
        if (!Whitelisted) {
            member.send("Hello, there i'm elerium to verify yourself type `.verify {YourUploaderKey}` in dms and to get your key go to here https://unverified-ape.xyz/HFYY5uSj.png")
                .then(function() {})
                .catch(function(err) {
                    console.error("waaaaa", err)
                })
        } else {
            let RoleID = "714791045619122196"
            let Guild = member.guild 
            let Member = Guild.member(member)
            let Role = Guild.roles.cache.get(RoleID)
            if (!Member.roles.cache.has(RoleID)) {
                Member.roles.add(Role)
                Webhook.send(Embed("elerium", "User has successfully verified themself", {
                    User: `<@${member.id}>`,
                    Key: UploadKey
                }))
                let MessageToSend = "Successfully verified"
                let User = Users[UploadKey]
                if (User.WasNotInGuild) {
                    MessageToSend = `${User.WasNotInGuild.Admin} has created an invite for you!\n${UploadKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploadKey}`
                    User.WasNotInGuild = undefined
                    fs.writeFileSync("userinfo.json", JSON.stringify(Users, null, "\t"))
                }
                member.send(MessageToSend)
                    .catch(function(err) {
                        console.error("waaaaa", err)
                    })
            }
        }
    }
})

AddCommand("verify", function(message, Args) {
    let RoleID = "714791045619122196"
    if (message.channel.type == "dm") {
        const Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
        if (Keys.includes(Args[1])) {
            let Guild = GetServer()
            let Member = Guild.member(message.author)
            if (!Member) return message.channel.send("Not in the members discord")
            let Role = Guild.roles.cache.get(RoleID)
            if (!Member.roles.cache.has(RoleID)) {
                Member.roles.add(Role)
                Webhook.send(Embed("elerium", "User has successfully verified themself", {
                    User: `<@${message.author.id}>`,
                    Key: Args[1]
                }))
                message.channel.send("Successfully verified")
                let Data = JSON.parse(fs.readFileSync("userinfo.json"))
                if (!Data[Args[1]]) {
                    Data[Args[1]] = {
                        IP: "",
                        DiscordId: message.author.id
                    }
                } else {
                    Data[Args[1]].DiscordId = message.author.id
                }
                fs.writeFileSync("userinfo.json", JSON.stringify(Data, null, "\t"))
            } else {
                message.channel.send("You already have the role")
            }
        } else {
            message.channel.send("Invaild Key")
        }
    } else {
        message.delete()
    }
})

AddCommand("createkey", async function(message, Args) {
    //`${User.WasNotInGuild.Admin} has created an invite for you!\n${UploadKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploadKey}>\nJoin our discord here - not being in our Discord could lead to termination of your key!\nhttps://elerium.cc/discord`
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            let UploaderKey = uuid.v4()
            let Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            let Guild = GetServer()
            Keys.push(UploaderKey)
            let Member = Guild.member(Args[1] || "no one")
            let EmbedFieldInfo = {
                Admin: `<@${message.author.id}>`,
                Key: UploaderKey
            }
            let UserInfoData = {
                IP: ""
            }
            if (!Member && Args[1]) {
                UserInfoData.WasNotInGuild = {
                    Admin: message.author.username
                }
            }
            if (Args[1]) {
                EmbedFieldInfo.User = `<@${Args[1]}>`
                UserInfoData.DiscordId = Args[1]
            }
            Data[UploaderKey] = UserInfoData
            fs.writeFileSync("./keys.json", JSON.stringify(Keys, null, "\t"))
            fs.writeFileSync("./userinfo.json", JSON.stringify(Data, null, "\t"))
            let EmbedMessage = Embed("elerium", "Admin has created a key", EmbedFieldInfo)
            AdminWebhook.send({
                username: "admin logs",
                embeds: [EmbedMessage]
            })
            if (Args[1]) {
                if (Member) {
                    let RoleID = "714791045619122196"
                    let Role = Guild.roles.cache.get(RoleID)
                    Member.send(`${message.author.username} has created an invite for you!\n${UploaderKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploaderKey}`)
                        .catch(function(err) {
                            message.author.send("Couldn't send the message to the user")
                        })
                    if (!Member.roles.cache.has(RoleID)) {
                        Member.roles.add(Role)
                    }
                    message.author.send(`Successfully whitelisted user\nKey\n${UploaderKey}`)
                } else {
                    let Invite = await Guild.channels.cache.get("714791968558809149").createInvite({
                        maxUses: 1,
                        maxAge: 0,
                        unique: true
                    })
                    message.author.send(`User cannot be found!\nMake sure they have joined this server\n${Invite.url}\nKey\n${UploaderKey}`)
                } 
            } else {
                message.channel.send(`Key was successfully created\n${UploaderKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploaderKey}\nJoin our discord here - not being in our Discord could lead to termination of your key!\nhttps://elerium.cc/discord`)
            }
        }
    } else { 
        message.delete()
    }
})

AddCommand("blacklist", function(message, Args) {
    var Key = Args[1]
    if (message.channel.type == "dm") { 
        if (GetAdminServer().member(message.author.id)) {
            if (!Key) return message.channel.send("Key argument is required")
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            var Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
            if (Keys.includes(Key)) {
                let Index = Keys.findIndex(function(value) {
                    return value == Key
                })
                Keys.splice(Index, 1)
                if (Data[Key]) {
                    Data[Key] = undefined
                }
                fs.writeFileSync("./keys.json", JSON.stringify(Keys, null, "\t"))
                fs.writeFileSync("./userinfo.json", JSON.stringify(Data, null, "\t"))
                let EmbedMessage = Embed("elerium", "An admin has blacklisted a key", {
                    Admin: `<@${message.author.id}>`,
                    Key: Key
                })
                AdminWebhook.send({
                    username: "admin logs",
                    embeds: [EmbedMessage]
                })
                message.channel.send("Success")
            } else {
                message.channel.send("Invaild Key")
            }
        }
    } else {
        message.delete()
    }
})

AddCommand("checkkey", function(message, Args) {
    var Key = Args[1]
    if (message.channel.type == "dm") { 
        if (GetAdminServer().member(message.author.id)) {
            if (!Key) return message.channel.send("Key argument is required")
            var Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            let EmbedMessage = Embed("elerium", "An admin has checked a key", {
                Admin: `<@${message.author.id}>`,
                Key: Key,
                Vaild: Keys.includes(Key) && true || false
            })

            AdminWebhook.send({
                username: "admin logs",
                embeds: [EmbedMessage]
            })

            message.channel.send(`Key validity: ${Keys.includes(Key)}\nDiscord: ${Data[Key] && "<@" + Data[Key].DiscordId + ">" || "Not found"}`)
        }
    } else {
        message.delete()
    }
})

AddCommand("delete", function(message, Args) {
    var File = Args[1]
    if (message.channel.type == "dm") { 
        if (GetAdminServer().member(message.author.id)) {
            if (!File) return message.channel.send("File argument is required")
            if (fs.existsSync(`./uploads/${File}`)) {
                let EmbedMessage = Embed("elerium", "An admin has deleted a file", {
                    Admin: `<@${message.author.id}>`,
                    File: File
                })

                AdminWebhook.send({
                    username: "admin logs",
                    embeds: [EmbedMessage]
                })
                fs.unlinkSync(`./uploads/${File}`)
                message.channel.send(`Successfully deleted the file`)
            } else {
                message.channel.send("File was not found in the server")
            }
        }
    } else {
        message.delete()
    }
})

AddCommand("findkey", function(message, Args) {
    var Key = Args[1]
    if (message.channel.type == "dm") { 
        if (GetAdminServer().member(message.author.id)) {
            if (!Key) return message.channel.send("Key argument is required")
            var Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
            var FoundKey
            Keys.forEach(function(Value) {
                if (Value.indexOf(Key) !== -1) {
                    FoundKey = Value
                }
            })
            message.channel.send(`The key was found: ${FoundKey || "Not Found"}`)
            var EmbedMessage = Embed("elerium", "An admin attempted to find a key", {
                Admin: `<@${message.author.id}>`,
                Key: Key,
                FoundKey: FoundKey || "Not Found"
            })

            AdminWebhook.send({
                username: "admin logs",
                embeds: [EmbedMessage]
            })

        }
    } else {
        message.delete()
    }   
})

AddCommand("getdownload", function(message, Args) {
    if (message.channel.type == "dm") { 
        let Users = GetUsers()
        var UploaderKey = ""
        var Has = false
        for (Key in Users) {
            let User = Users[Key]
            if (User.DiscordId == message.author.id) {
                UploaderKey = Key
                Has = true
            } 
        }
        if (Has) {
            message.author.send(`Your key\n${UploaderKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploaderKey}`)
        } else {
            message.author.send("You were not found in the user info database")
        }

    } else {
        message.delete()
    }   
})

AddCommand("generateconfig", function(message, Args) {
    if (message.channel.type == "dm") { 
        if (!Args[1]) return message.channel.send("Domain argument is required")
        const getDomainResult = getDomain(Args[1])
        const VaildDomains = JSON.parse(fs.readFileSync("config.json", {encoding: "utf8"})).VaildDomains
        const ConvertedDomain = getDomainResult[0]
        const Wildcard = getDomainResult[1]
        let Users = GetUsers()
        var UploaderKey = ""
        var Has = false
        for (Key in Users) {
            let User = Users[Key]
            if (User.DiscordId == message.author.id) {
                UploaderKey = Key
                Has = true
            } 
        }
        if (Has) {
            if (VaildDomains[ConvertedDomain]) {
                let DomainInfo = VaildDomains[ConvertedDomain]
                if (Wildcard && !DomainInfo.wildcard) return message.channel.send("Domain was not wildcarded")
                message.author.send(`Download the config here\nhttps://elerium.cc/config?key=${UploaderKey}&domain=${Args[1]}${(Args[2] || "false") === "true" && "&embed=true" || ""}`)
            } else {
                message.channel.send("Invaild Domain")
            }
        } else {
            message.author.send("You were not found in the user info database")
        }

    } else {
        message.delete()
    }   
})


AddCommand("addinv", function(message, Args) {
    if (!Flags.Invites) return
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[2] || Typeof(Number(Args[2])) !== "number") return message.channel.send("Amount argument is required")
            if (!Args[1]) return message.channel.send("A user id argument is required")
            let Amount = Number(Args[2])
            let EmbedMessage = Embed("elerium", "An admin has added a invite for a user", {
                Admin: `<@${message.author.id}>`,
                User: `<@${Args[1]}>`,
                Amount: Args[2]
            })
            AdminWebhook.send({
                username: "admin logs",
                embeds: [EmbedMessage]
            })
            InviteSystem.add(Args[1], Amount)
            message.channel.send(`Successfully added ${Args[2]} invites to the user`)
        }
    } else { 
        message.delete()
    }
})

AddCommand("checkinvs", function(message, Args) {
    if (!Flags.Invites) return
    if (message.channel.type == "dm") {
        if (Args[1]) {
            if (GetAdminServer().member(message.author.id)) {
                let Invites = InviteSystem.get(Args[1])
                message.channel.send("The user currently has " + Invites + " Invites")
            }
        } else {
            let Invites = InviteSystem.get(message.author.id)
            message.channel.send("You currently have " + Invites + " Invites")
        }
        message.delete()
    }
})

AddCommand("setinv", function(message, Args) {
    if (!Flags.Invites) return
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[2] || Typeof(Number(Args[2])) !== "number") return message.channel.send("Value argument is required")
            if (!Args[1]) return message.channel.send("A user id argument is required")
            let Amount = Number(Args[2]) || 0
            let EmbedMessage = Embed("elerium", "An admin has changed the invites for a user", {
                Admin: `<@${message.author.id}>`,
                User: `<@${Args[1]}>`,
                Value: Args[2]
            })
            AdminWebhook.send({
                username: "admin logs",
                embeds: [EmbedMessage]
            })
            InviteSystem.set(Args[1], Amount)
            message.channel.send(`Successfully changed to ${Args[2]} invites to the user`)
        }
    } else { 
        message.delete()
    }
})

AddCommand("eval", function(message, Args) {
    const Sender = message.author.id
    if(!evalAccess.includes(Sender)) {return}
    Args.splice(0, 1)
    try {
        const timebefore = process.hrtime()
        var Script = Args.join(" ")
        if (Script.split("\n").length !== 1) {
            let Lines = Script.split("\n")
            if (Lines[0].search("```") == -1) {
                return
            }
            Lines.splice(0, 1)
            Lines.pop()
            Script = Lines.join("\n")
        }
        const evalresult = eval(Script)
        const timenow = process.hrtime(timebefore)[1] / 1000000
        message.channel.send(Embed("elerium", "Eval", {["Done executing in " + timenow.toString() + " ms"]: "```" + require("util").inspect(evalresult) + "```"}))
    }
    catch (err){
        message.channel.send(Embed("elerium", "Eval", {"Error!": "```" + err.message + "```"}))
    }
})

AddCommand("createinv", async function(message, Args) {
    if (!Flags.Invites) return
    if (message.channel.type == "dm")  {
        let CurrentInvites = InviteSystem.get(message.author.id)
        if (CurrentInvites > 0) {
            if (!Args[1]) return message.channel.send("Discord id argument is required")
            let UploaderKey = uuid.v4()
            let Keys = JSON.parse(fs.readFileSync("./keys.json", {encoding: "utf8"}))
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            let Guild = GetServer()
            Keys.push(UploaderKey)
            let Member = Guild.member(Args[1] || "no one")
            let EmbedFieldInfo = {
                User: `<@${message.author.id}>`,
                Key: UploaderKey
            }
            let UserInfoData = {
                IP: ""
            }
            if (!Member && Args[1]) {
                UserInfoData.WasNotInGuild = {
                    Admin: message.author.username
                }
            }
            if (Args[1]) {
                EmbedFieldInfo.User = `<@${Args[1]}>`
                UserInfoData.DiscordId = Args[1]
            }
            Data[UploaderKey] = UserInfoData
            fs.writeFileSync("./keys.json", JSON.stringify(Keys, null, "\t"))
            fs.writeFileSync("./userinfo.json", JSON.stringify(Data, null, "\t"))
            let EmbedMessage = Embed("elerium", "A user has created a invite", EmbedFieldInfo)
            InviteWebhook.send({
                username: "invite logs",
                embeds: [EmbedMessage]
            })
            if (Args[1]) {
                if (Member) {
                    let RoleID = "714791045619122196"
                    let Role = Guild.roles.cache.get(RoleID)
                    Member.send(`${message.author.username} has created an invite for you!\n${UploaderKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploaderKey}`)
                        .catch(function(err) {
                            message.author.send("Couldn't send the message to the user")
                        })
                    if (!Member.roles.cache.has(RoleID)) {
                        Member.roles.add(Role)
                    }
                    message.author.send("Successfully whitelisted user")
                } else {
                    let Invite = await Guild.channels.cache.get("714791968558809149").createInvite({
                        maxUses: 1,
                        maxAge: 0,
                        unique: true
                    })
                    message.author.send(`User cannot be found!\nMake sure they have joined this server\n${Invite.url}`)
                } 
            } else {
                message.channel.send(`Key was successfully created\n${UploaderKey}\nDownload the config here\nhttps://elerium.cc/config?key=${UploaderKey}\nJoin our discord here - not being in our Discord could lead to termination of your key!\nhttps://elerium.cc/discord`)
            }
            InviteSystem.add(message.author.id, -1)
        } else {
            return message.channel.send("You do not have enough invites")
        }
    }
})

AddCommand("resetip", function(message, Args) {
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[1]) return message.channel.send("Key argument is required")
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            if (Data[Args[1]]) {
                let EmbedMessage = Embed("elerium", "An admin has resetted key's ip", {
                    Admin: `<@${message.author.id}>`,
                    Key: Args[1]
                })
                AdminWebhook.send({
                    username: "admin logs",
                    embeds: [EmbedMessage]
                })
                Data[Args[1]].IP = ""
                fs.writeFileSync("userinfo.json", JSON.stringify(Data, null, "\t"))
                message.channel.send(`Successfully resetted the key's ip`)
            } else {
                message.channel.send("Couldn't find the user in the userinfo database")
            }
        }
    } else { 
        message.delete()
    }
})

AddCommand("ignoretoggle", function(message, Args) {
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[1]) return message.channel.send("Key argument is required")
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            if (Data[Args[1]]) {
                let Flag = Data[Args[1]].ignore_flag || false
                let EmbedMessage = Embed("elerium", "An admin has toggled ignore check", {
                    Admin: `<@${message.author.id}>`,
                    Key: Args[1],
                    Flag: !Flag
                })
                AdminWebhook.send({
                    username: "admin logs",
                    embeds: [EmbedMessage]
                })
                Data[Args[1]].ignore_flag = !Flag
                fs.writeFileSync("userinfo.json", JSON.stringify(Data, null, "\t"))
                message.channel.send(`Successfully toggled ignore_flag on the key`)
            } else {
                message.channel.send("Couldn't find the user in the userinfo database")
            }
        }
    } else { 
        message.delete()
    }
})

AddCommand("ignoreuploadlog", function(message, Args) {
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[1]) return message.channel.send("Key argument is required")
            let Data = JSON.parse(fs.readFileSync("userinfo.json"))
            if (Data[Args[1]]) {
                let Flag = Data[Args[1]].ignore_upload_flag || false
                let EmbedMessage = Embed("elerium", "An admin has toggled ignore upload check", {
                    Admin: `<@${message.author.id}>`,
                    Key: Args[1],
                    Flag: !Flag
                })
                AdminWebhook.send({
                    username: "admin logs",
                    embeds: [EmbedMessage]
                })
                Data[Args[1]].ignore_upload_flag = !Flag
                fs.writeFileSync("userinfo.json", JSON.stringify(Data, null, "\t"))
                message.channel.send(`Successfully toggled ignore_upload_flag on the key`)
            } else {
                message.channel.send("Couldn't find the user in the userinfo database")
            }
        }
    } else { 
        message.delete()
    }
})

AddCommand("linkdiscord", function(message, Args) {
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[2] || Typeof(Number(Args[2])) !== "number") return message.channel.send("A Discord Id argument is required")
            if (!Args[1]) return message.channel.send("A key argument is required")
            let Keys = JSON.parse(fs.readFileSync("keys.json")) 
            let Data = JSON.parse(fs.readFileSync("userinfo.json")) 
            if (!Keys.includes(Args[1])) return message.channel.send("Invaild Key")
            if (Data[Args[1]] && Data[Args[1]].DiscordId || undefined) return message.channel.send("Key is already linked")
            let EmbedMessage = Embed("elerium", "An admin has linked a discord user to a key", {
                Admin: `<@${message.author.id}>`,
                User: `<@${Args[2]}>`,
                Key: Args[1]
            })
            AdminWebhook.send({
                username: "admin logs",
                embeds: [EmbedMessage]
            })
            if (Data[Args[1]]) {
                Data[Args[1]].DiscordId = Args[2]
                fs.writeFileSync("./userinfo.json", JSON.stringify(Data, null, "\t"))
            } else {
                Data[Args[1]] = {
                    IP: "",
                    DiscordId: Args[2]
                }
                fs.writeFileSync("./userinfo.json", JSON.stringify(Data, null, "\t"))
            }
            message.channel.send(`Successfully linked the discord user to the key`)
        }
    } else { 
        message.delete()
    }
})

AddCommand("unlinkdiscord", function(message, Args) {
    if (message.channel.type == "dm") {
        if (GetAdminServer().member(message.author.id)) {
            if (!Args[1]) return message.channel.send("A key argument is required")
            let Keys = JSON.parse(fs.readFileSync("keys.json")) 
            let Data = JSON.parse(fs.readFileSync("userinfo.json")) 
            if (!Keys.includes(Args[1])) return message.channel.send("Invaild Key")
            if (Data[Args[1]]) {
                let EmbedMessage = Embed("elerium", "An admin has unlinked a discord user to a key", {
                    Admin: `<@${message.author.id}>`,
                    Key: Args[1]
                })
                AdminWebhook.send({
                    username: "admin logs",
                    embeds: [EmbedMessage]
                })
                Data[Args[1]].DiscordId = undefined
                fs.writeFileSync("./userinfo.json", JSON.stringify(Data, null, "\t"))
                message.channel.send(`Successfully linked the discord user to the key`)
                
            } else {
                message.channel.send("Couldn't find the user in the userinfo database")
            }
        }
    } else { 
        message.delete()
    }
})

Bot.on("message", function(message) {
    if (message.author.id == Bot.user.id) return
    let Args = message.content.split(" ")
    let RoleID = "714791045619122196"
    
    /*let NitroBoostsTypes = [
        "USER_PREMIUM_GUILD_SUBSCRIPTION",
        "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1",
        "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2",
        "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3"
    ]

    if (NitroBoostsTypes.includes(message.type)) {
        InviteSystem.add(message.author.id, 2)
    }*/
    if (message.channel.id == "724198934041591870") {
        message.react("👍")
        message.react("👎")
    }
    if (Commands[Args[0]]) {
        try {
            let Command = Args[0]
            Commands[Command].callback(message, Args)
        } catch (err) {
            message.channel.send("There was a error in the command please dm stroketon about it")
            console.error(err)
        }
    }
})

app.listen(5056)
Bot.login(Config.BotToken)