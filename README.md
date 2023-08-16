Simple NodeJS application to receive data from Ecowitt connected devices and write to InfluxDB. I will write this readme eventually. Updated readme for TelegramBot

Below is an example .env file containing all the information needed to run:

    #InfluxDB Parameters
    INFLUX_HOST=
    INFLUX_BUCKET=
    INFLUX_TOKEN=
    INFLUX_ORG=

    #Telegram Parameters
    TELEGRAM_TOKEN=

    #OpenWeather API Parameters
    OLAT=
    OLON=
    OAPIKEY=

Below is an example SystemD unit file to install the API as a service

    [Unit]
    Description=Simple NodeJS server to parse incoming Ecowitt messages
    Documentation=https://github.com/d4rk0wl/ecowitt_influxDB-parser/
    After=network-online.target
    
    [Service]
    User= #NON-ROOT USER#
    Group= #NON-ROOT GROUP#
    EnvironmentFile= #PATH TO YOUR ENVIRONMENT VARIABLE#
    ExecStart= #PATH TO NODE EXECUTABLE AND SERVER.JS FILE#
    Restart=on-failure
    
    [Install]
    WantedBy=multi-user.target
    Alias=weather-api.service