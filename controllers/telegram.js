const TelegramBot = require('node-telegram-bot-api');
const AsciiTable = require('ascii-table');
const fetch = require('node-fetch')
const fs = require('fs');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: {interval: 5000}});

const writeBuffer = (measurements) => {
    const date = new Date()

    const { tempinf, humidityin, tempf, humidity, winddir, windspeedmph, windgustmph, solarradiation, uv, rrain_piezo, drain_piezo, ws90cap_volt, wh90batt, temp1f, humidity1, temp2f, humidity2, temp3f, humidity3, batt1, batt2, batt3 } = measurements

    const bufferData = {
        "Time": date.toISOString(), 
        "Temperature": {
            "Outdoors": tempf,
            "Kitchen": temp1f,
            "LivingRoom": tempinf,
            "Office": temp2f,
            "Bedroom": temp3f
        },
        "Humidity": {
            "Outdoors": humidity,
            "Kitchen": humidity1,
            "LivingRoom": humidityin,
            "Office": humidity2,
            "Bedroom": humidity3
        },
        "WindDirection": winddir,
        "WindSpeed": windspeedmph,
        "WindGust": windgustmph,
        "SolarRadiation": solarradiation,
        "UV": uv,
        "RainRate": rrain_piezo,
        "DailyRain": drain_piezo,
        "CapacitorVoltage": ws90cap_volt,
        "BatteryVoltage": wh90batt,
        "Channel1Status": batt1,
        "Channel2Status": batt2,
        "Channel3Status": batt3
    }

    fs.writeFileSync(__dirname + '/../Buffer/last.json', JSON.stringify(bufferData), (err) => console.log(err))
}

const generateReport = (options) => {
    data = JSON.parse(fs.readFileSync(__dirname + '/../Buffer/last.json', {encoding: 'utf-8', flag: 'r'}));
    date = new Date(data.Time)

    let table = new AsciiTable(`Weather Report - ${date.toLocaleString('en-US')}`)
    table.setHeading('Metric', 'Location', 'Value')

    const addTemperature = () => {
        table.addRow('Temperature', 'Outdoors', `${data.Temperature.Outdoors}\xB0F`)
        table.addRow('Temperature', 'Kitchen', `${data.Temperature.Kitchen}\xB0F`)
        table.addRow('Temperature', 'Living Room', `${data.Temperature.LivingRoom}\xB0F`)
        table.addRow('Temperature', 'Office', `${data.Temperature.Office}\xB0F`)
        table.addRow('Temperature', 'Bedroom', `${data.Temperature.Bedroom}\xB0F`) 
    }

    const addHumidity = () => {
        table.addRow('Humidity', 'Outdoors', `${data.Humidity.Outdoors}%`)
        table.addRow('Humidity', 'Kitchen', `${data.Humidity.Kitchen}%`)
        table.addRow('Humidity', 'Living Room', `${data.Humidity.LivingRoom}%`)
        table.addRow('Humidity', 'Office', `${data.Humidity.Office}%`)
        table.addRow('Humidity', 'Bedroom', `${data.Humidity.Bedroom}%`) 
    }

    const addWind = () => {
        table.addRow('Wind Direction', '-', `${data.WindDirection}\xB0`)
        table.addRow('Wind Speed', '-', `${data.WindSpeed} mph`)
        table.addRow('Wind Gust', '-', `${data.WindGust} mph`)
    }

    const addSolar = () => {
        table.addRow('Solar Radiation', '-', `${data.SolarRadiation} W/m\xB2`)
        table.addRow('UV Index', '-', data.UV)
    }

    const addRain = () => {
        table.addRow('Rain Rate', '-', `${data.RainRate} in`)
        table.addRow('Daily Rain', '-', `${data.DailyRain} in`)
    }

    const addStatus = () => {
        table.addRow('Capacitor Voltage', '-', `${data.CapacitorVoltage} V`)
        table.addRow('Battery Voltage', '-', `${data.BatteryVoltage} V`)
        table.addRow('Channel 1', 'Kitchen', `${data.batt1}`)
        table.addRow('Channel 2', 'Office', `${data.batt2}`)
        table.addRow('Channel 3', 'Bedroom', `${data.batt3}`)

    }

    let type = options.charAt(0).toUpperCase() + options.slice(1)
    return new Promise((Resolve, Reject) => {
        switch(type) {
            case 'All':
                addTemperature()
                addHumidity()
                addWind()
                addSolar()
                addRain()
                addStatus()

                Resolve(table)
                break;
            case 'Temperature':
                addTemperature()

                Resolve(table)
                break;
            case 'Status':
                addStatus()

                Resolve(table)
                break;
            default:
                Reject('Invalid metric - please use "all", "temperature"')
        }
    })
}

const generateForecast = async (options) => {
    try {
        const APIUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${process.env.OLAT}&lon=${process.env.OLON}&appid=${process.env.OAPIKEY}&units=imperial&exclude=hourly,minutely,current`
        const response = await fetch(APIUrl)
        var data = await response.json()
    } catch(error) {
        return(`Unable to query remote API server - ${error}`)
    }

    try {
        let type = options.charAt(0).toUpperCase() + options.slice(1)

        let table = new AsciiTable(`Weather Forecast - ${type}`)
    
        switch(type) {
            case 'Summary':
                table.setHeading('Date', 'Summary')
                data.daily.forEach((day) => {
                    let date = new Date(day.dt * 1000)
                    table.addRow(date.toLocaleDateString("en-US"), day.summary)
                })
                return table
                break;
            case 'Daylight':
                table.setHeading('Date', 'Sunrise','Sunset', 'Total Day')
                data.daily.forEach((day) => {
                    let date = new Date(day.dt * 1000)
                    let sunrise = new Date(day.sunrise * 1000)
                    let sunset = new Date(day.sunset * 1000)
                    let total = (((sunset - sunrise)  / 3600) / 1000).toFixed(1)

                    table.addRow(`${date.toLocaleDateString("en-US")}`, sunrise.toLocaleTimeString("en-US"), sunset.toLocaleTimeString("en-US"), `${total} hours`)
                })
                return table
                break;
            case "Temperature":
                table.setHeading('Date', 'High', 'Low', 'Sky')
                data.daily.forEach((day) => {
                    let date = new Date(day.dt * 1000)
                    table.addRow(date.toLocaleDateString("en-US"), day.temp.max, day.temp.min, day.weather[0].description)
                })
                return table
                break;
            default:
                return "Invalid option"
    
        }
    } catch(error) {
        return(`Unable to build table - ${error}`)
    }
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id

    const sendReport = async (options) => {
        try {
            let table = await generateReport(options)
            bot.sendMessage(chatId, `<pre>${table}</pre>`, {parse_mode: "html"})
        } catch(error) {
            bot.sendMessage(chatId, `${error}`)
        }
    }

    const sendForecast = async (options) => {
        try {
            let forecast  = await generateForecast(options)
            bot.sendMessage(chatId, `<pre>${forecast}</pre>`, {parse_mode: "html"})
        } catch(error) {
            bot.sendMessage(chatId, `${error}`)
        }
    }

    const sendHelp = async () => {
        try {
            const helpText = await fs.readFileSync(__dirname + '/bot-help.html', {encoding: 'utf-8', flag: 'r'})
            bot.sendMessage(chatId, helpText, {parse_mode: "HTML"})
        } catch(error) {
            bot.sendMessage(chatId, `${error}`)
        }
    }

    let command = msg.text.split(" ")

    switch(command[0].charAt(0).toUpperCase() + command[0].slice(1)) {
        case 'Report':
            sendReport(command[1])
            break;
        case 'Forecast':
            sendForecast(command[1])
            break;
        case 'Help':
            sendHelp()
            break;
        default:
            bot.sendMessage(chatId, 'Invalid command - please use help if needed')
            break;
    }

})

module.exports = {
    writeBuffer
}