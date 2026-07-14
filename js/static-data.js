// COSMIC ODYSSEY — Static & Fallback Data Dossier

export const planetsData = {
    mercury: {
        id: "PLANET_REF // 001",
        name: "MERCURY",
        tagline: "The Scorched Messenger",
        diameter: "4,879 km",
        gravity: "3.70 m/s²",
        dayLength: "1,408 hours",
        yearLength: "88 Earth Days",
        temp: "167 °C",
        moons: "0 Moons",
        description: "The smallest and closest planet to the Sun. Mercury experiences extreme temperature swings ranging from freezing night shadows to blazing solar exposure due to its lack of atmosphere.",
        color: "#888888",
        sizeScale: 0.38, // Relative to Earth = 1
        orbitRadius: 15,
        orbitSpeed: 0.04
    },
    venus: {
        id: "PLANET_REF // 002",
        name: "VENUS",
        tagline: "The Hostile Twin",
        diameter: "12,104 km",
        gravity: "8.87 m/s²",
        dayLength: "5,832 hours",
        yearLength: "225 Earth Days",
        temp: "464 °C",
        moons: "0 Moons",
        description: "Venus is wrapped in a runaway greenhouse effect with a crushing carbon dioxide atmosphere and sulfuric acid clouds, making it the hottest planet in the solar system.",
        color: "#e3bb76",
        sizeScale: 0.95,
        orbitRadius: 22,
        orbitSpeed: 0.015
    },
    earth: {
        id: "PLANET_REF // 003",
        name: "EARTH",
        tagline: "The Living Sanctuary",
        diameter: "12,742 km",
        gravity: "9.81 m/s²",
        dayLength: "24 hours",
        yearLength: "365 Earth Days",
        temp: "15 °C",
        moons: "1 Moon",
        description: "Our home planet. Earth is the only world known to harbor life, with liquid water oceans covering 70% of its surface and a protective nitrogen-oxygen atmosphere.",
        color: "#2a82e6",
        sizeScale: 1.0,
        orbitRadius: 30,
        orbitSpeed: 0.01
    },
    mars: {
        id: "PLANET_REF // 004",
        name: "MARS",
        tagline: "The Rusted Desert",
        diameter: "6,779 km",
        gravity: "3.71 m/s²",
        dayLength: "24.6 hours",
        yearLength: "687 Earth Days",
        temp: "-63 °C",
        moons: "2 Moons",
        description: "Cold, dry, and coated in iron oxide dust, Mars is the most explored terrestrial body in our solar system, hosting rovers, landers, and future human dreams.",
        color: "#c1440e",
        sizeScale: 0.53,
        orbitRadius: 38,
        orbitSpeed: 0.008
    },
    jupiter: {
        id: "PLANET_REF // 005",
        name: "JUPITER",
        tagline: "The Sovereign Giant",
        diameter: "139,820 km",
        gravity: "24.79 m/s²",
        dayLength: "9.9 hours",
        yearLength: "12 Earth Years",
        temp: "-108 °C",
        moons: "95 Moons",
        description: "A colossal gas giant more than twice as massive as all other planets combined. Jupiter is famous for its colorful cloud bands and the ancient Great Red Spot storm.",
        color: "#b07f35",
        sizeScale: 2.2, // Visual scale compressed slightly for viewport UI
        orbitRadius: 50,
        orbitSpeed: 0.004
    },
    saturn: {
        id: "PLANET_REF // 006",
        name: "SATURN",
        tagline: "The Ringed Jewel",
        diameter: "116,460 km",
        gravity: "10.44 m/s²",
        dayLength: "10.7 hours",
        yearLength: "29 Earth Years",
        temp: "-139 °C",
        moons: "146 Moons",
        description: "Adorned with a complex, dazzling ring system made of billions of ice and rock particles, Saturn is a gas giant with the lowest density in the solar system.",
        color: "#e2bf7d",
        sizeScale: 1.8,
        orbitRadius: 65,
        orbitSpeed: 0.002
    },
    uranus: {
        id: "PLANET_REF // 007",
        name: "URANUS",
        tagline: "The Tilted Ice Giant",
        diameter: "50,724 km",
        gravity: "8.69 m/s²",
        dayLength: "17.2 hours",
        yearLength: "84 Earth Years",
        temp: "-197 °C",
        moons: "28 Moons",
        description: "An ice giant rotating on its side at an extreme 98-degree tilt. Uranus possesses a pale cyan tint due to atmospheric methane and is surrounded by faint vertical rings.",
        color: "#bbf2f6",
        sizeScale: 1.2,
        orbitRadius: 78,
        orbitSpeed: 0.001
    },
    neptune: {
        id: "PLANET_REF // 008",
        name: "NEPTUNE",
        tagline: "The Windswept Abyss",
        diameter: "49,244 km",
        gravity: "11.15 m/s²",
        dayLength: "16.1 hours",
        yearLength: "165 Earth Years",
        temp: "-201 °C",
        moons: "16 Moons",
        description: "A dark, freezing ice giant subject to the solar system's fastest winds, exceeding 2,100 km/h. Neptune is a rich cobalt blue driven by methane absorption.",
        color: "#274687",
        sizeScale: 1.15,
        orbitRadius: 90,
        orbitSpeed: 0.0007
    }
};

export const agenciesData = {
    nasa: {
        name: "NASA",
        fullName: "National Aeronautics & Space Admin.",
        founded: "1958",
        hq: "Washington D.C., USA",
        focus: "Deep-space & lunar exploration, robotic planetary science, Earth observation.",
        launchesCount: 38,
        details: "The United States national space agency, pioneered the Apollo lunar landings, Space Shuttle, Voyager probes, James Webb Telescope, and leading the international Artemis lunar program."
    },
    spacex: {
        name: "SPACEX",
        fullName: "Space Exploration Technologies Corp.",
        founded: "2002",
        hq: "Hawthorne, California, USA",
        focus: "Reusable commercial launches, orbital cargo/crew transport, Mars colonization.",
        launchesCount: 114,
        details: "A private aerospace manufacturer founded by Elon Musk. Achieved the first orbitally-reusable liquid propellant rockets (Falcon 9/Heavy) and currently developing Starship for heavy-lift interplanetary flight."
    },
    esa: {
        name: "ESA",
        fullName: "European Space Agency",
        founded: "1975",
        hq: "Paris, France",
        focus: "Multinational scientific collaboration, space science, Earth observation, Ariane rockets.",
        launchesCount: 12,
        details: "An intergovernmental organization of 22 member nations. Responsible for Mars Express, Rosetta (first comet lander), Euclid space telescope, and major contributions to the James Webb Space Telescope."
    },
    jaxa: {
        name: "JAXA",
        fullName: "Japan Aerospace Exploration Agency",
        founded: "2003",
        hq: "Chofu, Tokyo, Japan",
        focus: "Aviation research, asteroid sample-return, lunar landers, space science.",
        launchesCount: 8,
        details: "Japan's national agency formed by combining three organizations. Noted for Hayabusa asteroid sample-return missions, high-reliability H-IIA/H3 rockets, and the SLIM lunar landing probe."
    },
    isro: {
        name: "ISRO",
        fullName: "Indian Space Research Organisation",
        founded: "1969",
        hq: "Bengaluru, India",
        focus: "Cost-efficient space transportation, planetary orbiters, communications satellites.",
        launchesCount: 9,
        details: "India's state space agency. Made global headlines for Mars Orbiter Mission (Mangalyaan) success on first attempt and Chandrayaan-3 landing near the lunar south pole."
    },
    roscosmos: {
        name: "ROSCOSMOS",
        fullName: "State Space Corporation Roscosmos",
        founded: "1992",
        hq: "Moscow, Russia",
        focus: "Human spaceflight, Soyuz space stations transport, navigation satellites.",
        launchesCount: 16,
        details: "Formed from the Soviet space program heritage, Roscosmos operates the historic Baikonur Cosmodrome, maintains Soyuz/Progress spacecraft for ISS operations, and leads GLONASS navigation."
    }
};

export const fallbackMissions = [
    {
        id: "m-apollo11",
        title: "APOLLO 11",
        agency: "NASA",
        date: "July 16, 1969",
        status: "Success",
        rocket: "Saturn V",
        site: "Kennedy Space Center, FL, USA",
        brief: "The historic mission that landed the first two humans, Neil Armstrong and Buzz Aldrin, on the Moon. 'One small step for man, one giant leap for mankind.'",
        type: "historical"
    },
    {
        id: "m-voyager1",
        title: "VOYAGER 1",
        agency: "NASA",
        date: "September 5, 1977",
        status: "Active",
        rocket: "Titan IIIE",
        site: "Cape Canaveral, FL, USA",
        brief: "Launched to explore Jupiter and Saturn, Voyager 1 is now the most distant human-made object, traveling in interstellar space beyond our Sun's heliosphere.",
        type: "historical"
    },
    {
        id: "m-cassini",
        title: "CASSINI-HUYGENS",
        agency: "NASA / ESA",
        date: "October 15, 1997",
        status: "Success",
        rocket: "Titan IVB",
        site: "Cape Canaveral, FL, USA",
        brief: "A collaborative mission that orbited Saturn for 13 years, discovering active liquid oceans on Enceladus and landing the Huygens probe on Titan.",
        type: "historical"
    },
    {
        id: "m-perseverance",
        title: "PERSEVERANCE ROVER",
        agency: "NASA",
        date: "July 30, 2020",
        status: "Active",
        rocket: "Atlas V 541",
        site: "Cape Canaveral, FL, USA",
        brief: "Designed to explore Jezero Crater on Mars, search for signs of ancient life, and collect rock/regolith samples for future return to Earth.",
        type: "historical"
    },
    {
        id: "m-jwst",
        title: "JAMES WEBB TELESCOPE",
        agency: "NASA / ESA / JAXA",
        date: "December 25, 2021",
        status: "Active",
        rocket: "Ariane 5",
        site: "Kourou, French Guiana",
        brief: "The premier space observatory of the decade. Positioned at Lagrange Point 2, Webb peers back 13.5 billion years to witness the first stars forming.",
        type: "historical"
    },
    {
        id: "m-polarisdawn",
        title: "POLARIS DAWN",
        agency: "SpaceX",
        date: "September 10, 2024",
        status: "Success",
        rocket: "Falcon 9 Block 5",
        site: "Kennedy Space Center, FL, USA",
        brief: "A private orbital flight piloted by Jared Isaacman, which achieved the highest Earth orbit since Apollo and completed the first commercial spacewalk.",
        type: "historical"
    },
    {
        id: "m-artemis2",
        title: "ARTEMIS II",
        agency: "NASA / CSA",
        date: "September 2026",
        status: "Go",
        rocket: "SLS Block 1",
        site: "Kennedy Space Center, FL, USA",
        brief: "The first crewed flight test under the Artemis program, sending four astronauts (including first woman and person of color to deep space) around the Moon.",
        type: "upcoming"
    },
    {
        id: "m-crew13",
        title: "CREW-13 ROTATION",
        agency: "SpaceX / NASA",
        date: "October 2026",
        status: "Go",
        rocket: "Falcon 9 Block 5",
        site: "Kennedy Space Center, FL, USA",
        brief: "Commercial Crew mission transporting four astronauts to the International Space Station for a six-month scientific expedition.",
        type: "upcoming"
    },
    {
        id: "m-europaclipper",
        title: "EUROPA CLIPPER",
        agency: "NASA",
        date: "October 2024 (Cruising)",
        status: "Active",
        rocket: "Falcon Heavy",
        site: "Kennedy Space Center, FL, USA",
        brief: "En route to Jupiter to investigate whether the icy moon Europa possesses subsurface ocean conditions suitable to support life.",
        type: "active"
    },
    {
        id: "m-slimsensor",
        title: "SLIM LUNAR LANDER",
        agency: "JAXA",
        date: "September 7, 2023",
        status: "Success",
        rocket: "H-IIA",
        site: "Tanegashima Space Center, Japan",
        brief: "Japan's 'Smart Lander for Investigating Moon' which achieved an ultra-precise 'pinpoint' landing within 55 meters of its target on the lunar surface.",
        type: "historical"
    }
];
