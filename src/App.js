import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import "./tailwind.min.css";
import { checkUser } from "./utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [primaryID, setPrimaryID] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [dependentsIDs, setDependentsIDs] = useState("");
  const [visaClass, setVisaClass] = useState("XX");
  const [userQty, setUserQty] = useState(0);
  const [sameConsular, setSameConsular] = useState(true);
  const [isOFCOnly, setIsOFCOnly] = useState(false);
  const [isRescheduleLater, setIsRescheduleLater] = useState(false);
  const [earliestDate, setEarliestDate] = useState(new Date());
  const [lastDate, setLastDate] = useState(
    new Date(new Date().getFullYear(), 7, 31)
  ); // June 10
  const [reschedule, setReschedule] = useState("false");
  const [agent, setAgent] = useState("Gujarat");
  const [username, setUsername] = useState("");
  // const [lastConsularDate, setLastConsularDate] = useState(
  //   new Date(new Date().setMonth(new Date().getMonth() + 1))
  // );
  const [isPriority, setIsPriority] = useState(false);
  const [gapDays, setGapDays] = useState(0); // Added state for gapDays

  const [cities, setCities] = useState({
    all: false,
    chennai: false,
    mumbai: true,
    kolkata: false,
    delhi: false,
    hyderabad: false,
  });

  const [consularCities, setConsularCities] = useState({
    all: false,
    chennai: false,
    mumbai: true,
    kolkata: false,
    delhi: false,
    hyderabad: false,
  });

  useEffect(() => {
    const gap = parseInt(gapDays, 10);
    if (!isNaN(gap) && gap >= 0) {
      const currentDate = new Date();
      const newEarliestDate = new Date();
      newEarliestDate.setDate(currentDate.getDate() + gap);
      setEarliestDate(newEarliestDate);
    } else {
      const currentDate = new Date();
      setEarliestDate(currentDate);
    }
  }, [gapDays]);
  

  function generateRandomStringBytes(size) {
    let id = "";
    for (let i = 0; i < size; i++) {
      id += ("00" + Math.floor(Math.random() * 256).toString(16)).slice(-2);
    }
    return id;
  }

  function generateTranceparent() {
    const traceValue = generateRandomStringBytes(16);
    const parentValue = generateRandomStringBytes(8);
    return `00-${traceValue}-${parentValue}-01`;
  }

  function generateRequestID() {
    const traceValue = generateRandomStringBytes(16);
    const parentValue = generateRandomStringBytes(8);
    return `|${traceValue}.${parentValue}`;
  }

  const fetchPrimaryID = async () => {
    const response = await fetch("https://www.usvisascheduling.com/en-US/", {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "request-id": generateRequestID(),
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-arch": '"arm"',
        "sec-ch-ua-bitness": '"64"',
        "sec-ch-ua-full-version": '"122.0.6261.69"',
        "sec-ch-ua-full-version-list":
          '"Chromium";v="122.0.6261.69", "Not(A:Brand";v="24.0.0.0", "Google Chrome";v="122.0.6261.69"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-model": '""',
        "sec-ch-ua-platform": '"macOS"',
        "sec-ch-ua-platform-version": '"14.3.1"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        traceparent: generateTranceparent(),
        "x-requested-with": "XMLHttpRequest",
      },
      referrer:
        "https://www.usvisascheduling.com/en-US/ofc-schedule/?reschedule=true",
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET",
      mode: "cors",
      credentials: "include",
    });
    const data = await response.text();
    const primaryNameMatches = data.match(
      /(?<=<span class="username">\s*)[^<]+?(?=\s*\(\d+\)\s*<\/span>)/
    );
    const applicationIDMatches = data.match(
      /"applicationId": "([a-f0-9-]{36})"/
    );
    if (applicationIDMatches) {
      const primaryNameAndIDDict = {
        primaryName: primaryNameMatches[0].trim(),
        primaryID: applicationIDMatches[1],
      };
      setPrimaryID(primaryNameAndIDDict.primaryID);
      setPrimaryName(primaryNameAndIDDict.primaryName);
      return primaryNameAndIDDict;
    } else {
      console.log("No applicationId found");
    }
  };

  const fetchDependentIDs = async (primaryID, isReschedule) => {
    const now = Date.now();
    let url = `https://www.usvisascheduling.com/en-US/custom-actions/?route=/api/v1/schedule-group/query-family-members-ofc&cacheString=${now}`;
    if (isReschedule === "true") {
      url = `https://www.usvisascheduling.com/en-US/custom-actions/?route=/api/v1/schedule-group/query-family-members-ofc-reschedule&cacheString=${now}`;
    }
    const response = await fetch(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.8",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "request-id": generateRequestID(),
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Brave";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-model": '""',
        "sec-ch-ua-platform": '"Linux"',
        "sec-ch-ua-platform-version": '"5.15.0"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        traceparent: generateTranceparent(),
        "x-requested-with": "XMLHttpRequest",
      },
      referrer: "https://www.usvisascheduling.com/en-US/ofc-schedule/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `parameters={"primaryId":"${primaryID}","visaClass":"all"}`,
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
    const data = await response.json();
    const membersArr = data["Members"];
    const dependentIDsArr = [];
    if (membersArr.length === 0) return primaryID;
    membersArr.forEach((member) => {
      dependentIDsArr.push(member["ApplicationID"]);
    });
    setDependentsIDs(JSON.stringify(dependentIDsArr));
    return JSON.stringify(dependentIDsArr);
  };

  const fetchVisaClass = async () => {
    try {
      const response = await fetch(
        "https://www.usvisascheduling.com/en-US/appointment-confirmation/"
      );
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const visaClassLabel = Array.from(doc.querySelectorAll("td")).find(
        (td) => td.textContent.trim() === "Visa Class:"
      );
      if (visaClassLabel && visaClassLabel.nextElementSibling) {
        const visaClass = visaClassLabel.nextElementSibling.textContent.trim();
        setVisaClass(visaClass);
        return visaClass;
      }
      throw new Error("Visa class not found");
    } catch (error) {
      console.error("Failed to fetch visa class:", error);
      return null;
    }
  };

  const checkReschedule = async () => {
    const response = await fetch(
      "https://www.usvisascheduling.com/en-US/appointment-confirmation/"
    );
    const text = await response.text();
    try {
      const ofcCount = text.match(/OFC APPOINTMENT DETAILS/g).length;
      if (ofcCount !== 0) return "true";
      else return "false";
    } catch (error) {
      return "false";
    }
  };

  const handleFill = async () => {
    const primaryData = await fetchPrimaryID();
    const visaClass = await fetchVisaClass();
    const isReschedule = await checkReschedule();
    setReschedule(isReschedule);
    console.log(isReschedule);
    const dependentsIDs = await fetchDependentIDs(
      primaryData.primaryID,
      isReschedule
    );
    console.log(primaryData);
    console.log(dependentsIDs);
    setUserQty(JSON.parse(dependentsIDs).length);
    setVisaClass(visaClass);
  };

  const convertToFirestoreFormat = (user) => {
    const formattedUser = {
      fields: {
        name: { stringValue: user.name },
        id: { stringValue: user.id },
        applicantsID: { stringValue: user.applicantsID },
        pax: { integerValue: user.pax.toString() },
        earliestMonth: { integerValue: user.earliestMonth.toString() },
        earliestDate: { integerValue: user.earliestDate.toString() },
        earliestDateInNumbers: {
          integerValue: user.earliestDateInNumbers.toString(),
        },
        lastDateInNumbers: { integerValue: user.lastDateInNumbers.toString() },
        lastMonth: { integerValue: user.lastMonth.toString() },
        lastDate: { integerValue: user.lastDate.toString() },
        location: {
          arrayValue: {
            values: user.location.map((loc) => ({ stringValue: loc })),
          },
        },
        consularLocation: {
          arrayValue: {
            values: user.consularLocation.map((loc) => ({ stringValue: loc })),
          },
        },
        reschedule: { stringValue: user.reschedule }, // Change made here
        visaClass: { stringValue: user.visaClass },
        sameConsular: { booleanValue: user.sameConsular },
        isOFCOnly: { booleanValue: user.isOFCOnly },
        isRescheduleLater: { booleanValue: user.isRescheduleLater },
        agent: { stringValue: user.agent },
        username: { stringValue: user.username },
        // lastConsularDate: { timestampValue: user.lastConsularDate },
        // lastConsularDateInNumbers: {
        //   integerValue: user.lastConsularDateInNumbers.toString(),
        // },
        gapDays: { integerValue: user.gapDays.toString() },
      },
    };
    if (user.priority !== undefined) {
      formattedUser.fields.priority = { booleanValue: user.priority };
    }
    return formattedUser;
  };

  const handlePushUser = async () => {
    const cityArray = Object.keys(cities).filter((city) => cities[city]);
    const locationArray = cityArray.includes("all")
      ? ["chennai", "mumbai", "kolkata", "delhi", "hyderabad"]
      : cityArray;
    var consularCityArray;
    var consularLocationArray;
    if (sameConsular) {
      consularCityArray = Object.keys(cities).filter((city) => cities[city]);
      consularLocationArray = cityArray.includes("all")
        ? ["chennai", "mumbai", "kolkata", "delhi", "hyderabad"]
        : cityArray;
    } else {
      consularCityArray = Object.keys(consularCities).filter(
        (city) => consularCities[city]
      );
      consularLocationArray = consularCityArray.includes("all")
        ? ["chennai", "mumbai", "kolkata", "delhi", "hyderabad"]
        : consularCityArray;
    }

    const earliestDateInNumbers =
      (earliestDate.getMonth() + 1) * 30 + earliestDate.getDate();
    const lastDateInNumbers =
      (lastDate.getMonth() + 1) * 30 + lastDate.getDate();
    // const lastConsularDateInNumbers =
    //   (lastConsularDate.getMonth() + 1) * 30 + lastConsularDate.getDate();

    const user = {
      name: primaryName,
      id: primaryID,
      applicantsID: dependentsIDs,
      pax: userQty,
      earliestMonth: earliestDate.getMonth() + 1,
      earliestDate: earliestDate.getDate(),
      earliestDateInNumbers,
      lastDateInNumbers,
      lastMonth: lastDate.getMonth() + 1,
      lastDate: lastDate.getDate(),
      location: locationArray,
      consularLocation: consularLocationArray,
      reschedule,
      visaClass,
      sameConsular,
      isOFCOnly,
      agent,
      username,
      // lastConsularDate: lastConsularDate.toISOString(),
      // lastConsularDateInNumbers,
      gapDays: parseInt(gapDays, 10),
      isRescheduleLater,
      priority: isPriority
    };

    const firestoreUser = convertToFirestoreFormat(user);
    const userExists = await checkUser(primaryID);

    if (!userExists) {
      fetch(
        `https://firestore.googleapis.com/v1/projects/usa-db-50f2e/databases/(default)/documents/users/${primaryID}?key=AIzaSyDqGqNYoygQhS61HPSnftOKor3z0mJqOkA`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(firestoreUser),
        }
      )
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          toast.success("Pushed");
        })
        .catch((error) => console.error(error));
    }
  };

  // const handlePushPriorityUser = async () => {
  //   const cityArray = Object.keys(cities).filter((city) => cities[city]);
  //   const locationArray = cityArray.includes("all")
  //     ? ["chennai", "mumbai", "kolkata", "delhi", "hyderabad"]
  //     : cityArray;
  //   var consularCityArray;
  //   var consularLocationArray;
  //   if (sameConsular) {
  //     consularCityArray = Object.keys(cities).filter((city) => cities[city]);
  //     consularLocationArray = cityArray.includes("all")
  //       ? ["chennai", "mumbai", "kolkata", "delhi", "hyderabad"]
  //       : cityArray;
  //   } else {
  //     consularCityArray = Object.keys(consularCities).filter(
  //       (city) => consularCities[city]
  //     );
  //     consularLocationArray = consularCityArray.includes("all")
  //       ? ["chennai", "mumbai", "kolkata", "delhi", "hyderabad"]
  //       : consularCityArray;
  //   }

  //   const earliestDateInNumbers =
  //     (earliestDate.getMonth() + 1) * 30 + earliestDate.getDate();
  //   const lastDateInNumbers =
  //     (lastDate.getMonth() + 1) * 30 + lastDate.getDate();
  //   const lastConsularDateInNumbers =
  //     (lastConsularDate.getMonth() + 1) * 30 + lastConsularDate.getDate();

  //   const user = {
  //     name: primaryName,
  //     id: primaryID,
  //     applicantsID: dependentsIDs,
  //     pax: userQty,
  //     earliestMonth: earliestDate.getMonth() + 1,
  //     earliestDate: earliestDate.getDate(),
  //     earliestDateInNumbers,
  //     lastDateInNumbers,
  //     lastMonth: lastDate.getMonth() + 1,
  //     lastDate: lastDate.getDate(),
  //     location: locationArray,
  //     consularLocation: consularLocationArray,
  //     reschedule,
  //     visaClass,
  //     sameConsular,
  //     isOFCOnly,
  //     priority: true,
  //     agent,
  //     username,
  //     lastConsularDate: lastConsularDate.toISOString(),
  //     lastConsularDateInNumbers,
  //     gapDays: parseInt(gapDays, 10),
  //     isRescheduleLater,
  //   };

  //   const firestoreUser = convertToFirestoreFormat(user);
  //   const userExists = await checkUser(primaryID);

  //   if (!userExists) {
  //     fetch(
  //       `https://firestore.googleapis.com/v1/projects/usa-db-50f2e/databases/(default)/documents/users/${primaryID}?key=AIzaSyDqGqNYoygQhS61HPSnftOKor3z0mJqOkA`,
  //       {
  //         method: "PATCH",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(firestoreUser),
  //       }
  //     )
  //       .then((response) => response.json())
  //       .then((result) => {
  //         console.log(result);
  //         toast.success("Pushed");
  //       })
  //       .catch((error) => console.error(error));
  //   }
  // };

  const handleReset = () => {
    const currentDate = new Date();
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    setEarliestDate(currentDate);
    setLastDate(lastDayOfMonth); // Set to the last date of the current month
    setSameConsular(true);
    setIsOFCOnly(false);
    setGapDays(0); // Reset gapDays to default value
  };

  const handleCityChange = (city) => {
    setCities((prev) => ({
      ...prev,
      [city]: !prev[city],
      all: city === "all" ? !prev.all : false,
    }));
  };
  const handleConsularCityChange = (city) => {
    setConsularCities((prev) => ({
      ...prev,
      [city]: !prev[city],
      all: city === "all" ? !prev.all : false,
    }));
  };

  useEffect(() => {
    if (cities.all) {
      setCities({
        all: true,
        chennai: false,
        mumbai: false,
        kolkata: false,
        delhi: false,
        hyderabad: false,
      });
    }
  }, [cities.all]);

  useEffect(() => {
    if (consularCities.all) {
      setConsularCities({
        all: true,
        chennai: false,
        mumbai: false,
        kolkata: false,
        delhi: false,
        hyderabad: false,
      });
    }
  }, [consularCities.all]);

  return (
    <div
      style={{
        width: "550px",
        height: "600px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div className="primary-name-container bg-white shadow-lg rounded-lg px-4 py-2 mt-6 flex items-end">
        <span id="primary-user-name-span">
          {primaryName !== "" ? primaryName : "John Doe"}
        </span>
        &nbsp;
        <span
          id="primary-user-qty-span"
          className={`ml-2 ${
            userQty === 0 ? "bg-white text-black" : "bg-blue-500 text-white"
          } text-xs py-1 px-2 rounded-full shadow`}
        >
          {userQty}
        </span>
        &nbsp;
        <span
          id="reschedule-title"
          className={`${
            reschedule === "true"
              ? "text-white bg-red-500"
              : "text-black bg-white"
          } text-xs py-1 px-2 rounded-full shadow`}
        >
          {reschedule === "true" ? "R" : "N"}
        </span>
        &nbsp;
        <span
          id="visa-class"
          className={`${
            visaClass === "XX" ? "text-black bg-white" : "text-white bg-black"
          } text-xs py-1 px-2 rounded-full shadow`}
        >
          {visaClass}
        </span>
        <span
          id="primary-id-indicator"
          className={`${
            primaryID === "" ? "text-black bg-white" : "text-white bg-green-500"
          } text-xs py-1 px-2 rounded-full shadow ml-1`}
        >
          P
        </span>
        <span
          id="dependent-id-indicator"
          className={`${
            dependentsIDs === ""
              ? "text-black bg-white"
              : "text-white bg-indigo-500"
          } text-xs py-1 px-2 rounded-full shadow ml-1`}
        >
          D
        </span>
      </div>
      <div className="primary-dependent-container mt-6 flex flex-row justify-center gap-4 hidden">
        <div className="primaryID-container">
          <input
            type="text"
            id="primary-id-input"
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Primary ID"
            value={primaryID}
            onChange={(e) => setPrimaryID(e.target.value)}
          />
        </div>
        <div className="dependents-container">
          <input
            type="text"
            id="dependents-id-input"
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dependents IDs"
            value={dependentsIDs}
            onChange={(e) => setDependentsIDs(e.target.value)}
          />
        </div>
      </div>
      <div className="city-container mt-6 flex flex-wrap gap-4">
        <div className="border border-gray-300 shadow-lg rounded-md px-4 py-2 flex gap-3">
          {["all", "chennai", "mumbai", "kolkata", "delhi", "hyderabad"].map(
            (city) => (
              <label key={city} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="city"
                  value={city}
                  checked={cities[city]}
                  onChange={() => handleCityChange(city)}
                  className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </span>
              </label>
            )
          )}
        </div>
      </div>
      {sameConsular ? (
        <div className="city-container mt-6 flex flex-wrap gap-4">
          <div className="border border-gray-300 shadow-lg rounded-md px-4 py-2 flex gap-3">
            {["all", "chennai", "mumbai", "kolkata", "delhi", "hyderabad"].map(
              (city) => (
                <label key={city} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="city"
                    value={city}
                    checked={consularCities[city]}
                    disabled
                    onChange={() => handleConsularCityChange(city)}
                    className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </span>
                </label>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="city-container mt-6 flex flex-wrap gap-4">
          <div className="border border-gray-300 shadow-lg rounded-md px-4 py-2 flex gap-3">
            {["all", "chennai", "mumbai", "kolkata", "delhi", "hyderabad"].map(
              (city) => (
                <label key={city} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="city"
                    value={city}
                    checked={consularCities[city]}
                    onChange={() => handleConsularCityChange(city)}
                    className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </span>
                </label>
              )
            )}
          </div>
        </div>
      )}

      <div className="flex flex-row gap-5">
        <div className="same-consular-container mt-5 flex flex-row gap-2 items-center">
          <p>Same Consular?</p>
          <input
            type="checkbox"
            checked={sameConsular}
            onChange={() => setSameConsular(!sameConsular)}
            className="shadow-md border"
          />
        </div>
        <div className="same-consular-container mt-5 flex flex-row gap-2 items-center">
          <p>OFC Only?</p>
          <input
            type="checkbox"
            checked={isOFCOnly}
            onChange={() => setIsOFCOnly(!isOFCOnly)}
            className="shadow-md border"
          />
        </div>
        <div className="same-consular-container mt-5 flex flex-row gap-2 items-center">
          <p>Reschedule Later?</p>
          <input
            type="checkbox"
            checked={isRescheduleLater}
            onChange={() => setIsRescheduleLater(!isRescheduleLater)}
            className="shadow-md border"
          />
        </div>
      </div>

      <div className="agent flex flex-row gap-2 mt-5">
        <div className="flex space-x-2">
          {[
            { name: "Gujarat", color: "red-500" },
            { name: "Telegram", color: "blue-500" },
            { name: "Sushma", color: "green-500" },
            { name: "Hyderabad", color: "black" },
            { name: "Customer", color: "gray-500" },
          ].map((agentInfo) => (
            <button
              key={agentInfo.name}
              onClick={() => setAgent(agentInfo.name)}
              className={`shadow-lg border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-10 transition-colors duration-300 ${
                agent === agentInfo.name
                  ? `bg-${agentInfo.color} text-white`
                  : ""
              }`}
            >
              {agentInfo.name[0]}
            </button>
          ))}
        </div>
        <div className="priority-btn-container">
          <button
            onClick={() => setIsPriority(!isPriority)}
            className={`w-10 h-10 rounded-full border border-gray-300 shadow-lg focus:outline-none transition-colors duration-300 ${
              isPriority ? "bg-red-600 text-white" : "bg-white"
            }`}
          >
            P
          </button>
        </div>
      </div>
      <div className="agent-username-container mt-6 flex flex-row gap-8 justify-center">
        <div className="username">
          <p>Username:</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="gap-container">
          <p>Gap:</p>
          <input
            type="number"
            id="gap-input"
            value={gapDays}
            onChange={(e) => setGapDays(e.target.value)}
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div
        className="earliest-date-filter-container mt-5 gap-10"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div className="date">
          <p>Earliest Date:</p>
          <DatePicker
            selected={earliestDate}
            onChange={(date) => setEarliestDate(date)}
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="date">
          <p>Last Date:</p>
          <DatePicker
            selected={lastDate}
            onChange={(date) => setLastDate(date)}
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex flex-row gap-10 mb-2">
        <div className="hidden-input">
          <p>Reschedule?</p>
          <input
            type="text"
            id="res-input"
            value={reschedule}
            onChange={(e) => setReschedule(e.target.value)}
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="fill-btn flex flex-row gap-4 mt-6">
        <button
          id="fill-btn"
          onClick={handleFill}
          className="btn bg-blue-600 text-white rounded-md px-3 py-2 shadow-md outline-none hover:bg-blue-700"
        >
          Fill Data
        </button>
        <button
          id="push-btn"
          onClick={handlePushUser}
          className="btn bg-green-600 text-white rounded-md px-3 py-2 shadow-md outline-none hover:bg-green-700"
        >
          Send User Details To DB
        </button>
        {/* <button
          id="push-priority-btn"
          onClick={handlePushPriorityUser}
          className="btn bg-red-600 text-white rounded-md px-3 py-2 shadow-md outline-none hover:bg-red-700"
        >
          Send As Priority
        </button> */}
        <button
          id="reset-btn"
          onClick={handleReset}
          className="btn bg-red-600 text-white rounded-md px-3 py-2 shadow-md outline-none hover:bg-gray-900"
        >
          Reset Dates
        </button>
      </div>
      <ToastContainer autoClose={1500} />
    </div>
  );
}

export default App;
