import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import "./tailwind.min.css";
import { checkUser } from "./utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { faker } from "@faker-js/faker";
import HtmlToJsonExtractor from "./HtmlToJsonExtractor";

function App() {
  const [primaryID, setPrimaryID] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [dependentsIDs, setDependentsIDs] = useState("");
  const [visaClass, setVisaClass] = useState("XX");
  const [userQty, setUserQty] = useState(0);
  const [UID, setUID] = useState("");
  const [sameConsular, setSameConsular] = useState(true);
  const [isOFCOnly, setIsOFCOnly] = useState(true);
  const [isRescheduleLater, setIsRescheduleLater] = useState(false);
  const [earliestDate, setEarliestDate] = useState(new Date());
  const [forceLockedOFC, setForceLockedOFC] = useState(false);
  const [preferredConsularLocation, setPreferredConsularLocation] =
    useState("");
  const [lastDate, setLastDate] = useState(
    new Date(new Date().getFullYear(), 8, 30)
  ); // June 10
  const [reschedule, setReschedule] = useState("false");
  const [agent, setAgent] = useState("Gujarat");
  const [username, setUsername] = useState("");
  const [contactId, setContactId] = useState("");
  // const [lastConsularDate, setLastConsularDate] = useState(
  //   new Date(new Date().setMonth(new Date().getMonth() + 1))
  // );
  const [isPriority, setIsPriority] = useState(false);
  const [gapDays, setGapDays] = useState(0); // Added state for gapDays
  const [extraData, setExtraData] = useState([]); // Added state for gapDays
  let ofcCount;

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
      newEarliestDate.setDate(currentDate.getDate() + gap + 1);
      setEarliestDate(newEarliestDate);
    } else {
      const currentDate = new Date();
      setEarliestDate(currentDate);
    }
  }, [gapDays]);

  useEffect(() => {
    const currentDate = new Date(earliestDate);
    let newLastDate;
    
    if (currentDate.getDate() <= 10) {
      newLastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else {
      newLastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 25);
    }
    
    setLastDate(newLastDate);
  }, [earliestDate]);

  const setLastDateCurrentMonth = () => {
    const currentDate = new Date(earliestDate);
    setLastDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
  };

  const setLastDateNextMonth = () => {
    const currentDate = new Date(earliestDate);
    setLastDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 25));
  };

  async function fetchUID(html) {
    const match = html.match(/<span class="username">[^<]*\((\d+)\)/);
    return match ? match[1] : null;
  }

  async function fetchPrimaryIDAndName(htmlString) {
    // Regex to extract the function ID after "showPpn"
    const idRegex = /function showPpn([a-f0-9]{32})\(/;
    const idMatch = htmlString.match(idRegex);
    const functionId = idMatch ? idMatch[1] : null;

    // Regex to extract the name "NARENDRAKUMAR RANMALBHAI ZALA"
    const nameRegex =
      /<td style="font-weight:bold;">\s*Appointment\(s\) Made By:\s*<\/td>\s*<td[^>]*>\s*([\w\s]+)\s*<\/td>/;
    const nameMatch = htmlString.match(nameRegex);
    const name = nameMatch ? nameMatch[1].trim() : null;
    const primaryData = {
      id: formatID(functionId),
      name: formatName(name),
    };
    return primaryData;
  }

  function formatName(name) {
    return name
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .trim() // Trim leading and trailing spaces
      .toLowerCase() // Convert the entire string to lowercase
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
  }

  function formatID(idWithoutDashes) {
    console.log(idWithoutDashes);
    if (idWithoutDashes.length !== 32) {
      throw new Error("ID should be 32 characters long without dashes.");
    }

    // Insert dashes at the appropriate positions
    const formattedID = `${idWithoutDashes.slice(0, 8)}-${idWithoutDashes.slice(
      8,
      12
    )}-${idWithoutDashes.slice(12, 16)}-${idWithoutDashes.slice(
      16,
      20
    )}-${idWithoutDashes.slice(20)}`;

    return formattedID;
  }

  async function fetchAllData() {
    try {
      const response = await fetch(
        "https://www.usvisascheduling.com/en-US/appointment-confirmation/"
      );
      const html = await response.text();
      let uid = await fetchUID(html);
      setUID(uid);
      console.log(uid);
      // console.log('Extra: ', extraData)
      let tempData = await fetchPrimaryIDAndName(html);
      setPrimaryID(tempData["id"]);
      setPrimaryName(tempData["name"]);
      let tempExtraData = HtmlToJsonExtractor(html);
      tempExtraData[0]["id"] = tempData["id"];
      setExtraData(tempExtraData);
      console.log(tempData);
      try {
        ofcCount = html.match(/OFC APPOINTMENT DETAILS/g).length || 0;
        // console.log(html)
        console.log(ofcCount);
        if (ofcCount != 0) {
          let consularCount = html.match(/CONSULAR APPOINTMENT DETAILS/g) || [];
          if (!forceLockedOFC) {
            if (consularCount.length === 0) {
              toast.error("Locked OFC Detected");
              setForceLockedOFC(true);
              return;
            }
          }
          setReschedule("true");
        } else setReschedule("false");
        console.log("Reschedule: ", reschedule);
        
      } catch (error) {
        // console.error(error)
        setReschedule("false");
        ofcCount = 0;
      }
      try {
        var cidmatch = html.match(/contactId:\s*'([a-f0-9-]+)'/);
    
        if (cidmatch) {
          setContactId(cidmatch[1]);
          console.log('Contact ID', contactId);
          console.log('Contact ID', cidmatch[1]);
        }
      } catch (error) {
        console.error(error);
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const visaClassLabel = Array.from(doc.querySelectorAll("td")).find(
        (td) => td.textContent.trim() === "Visa Class:"
      );
      if (visaClassLabel && visaClassLabel.nextElementSibling) {
        const visaClass = visaClassLabel.nextElementSibling.textContent.trim();
        // console.log("Visa Class: ", visaClass);
        setVisaClass(visaClass);
      }
      // console.log(reschedule, ofcCount)
      const dependentsIDs = await fetchDependentIDs(tempData["id"], reschedule);
      console.log("Dependents: ", dependentsIDs);
      setDependentsIDs(dependentsIDs);
      setUserQty(JSON.parse(dependentsIDs).length || 1);
      // console.log("Users: ", userQty);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

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
    if (ofcCount !== 0) {
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
    // console.log(data)
    const membersArr = data["Members"];
    console.log(membersArr);
    const dependentIDsArr = [];
    if (membersArr.length === 0) dependentIDsArr.push(primaryID);
    membersArr.forEach((member) => {
      dependentIDsArr.push(member["ApplicationID"]);
    });
    setDependentsIDs(JSON.stringify(dependentIDsArr));
    return JSON.stringify(dependentIDsArr);
  };



  const handleFill = async () => {
    // const primaryData = await fetchPrimaryID();
    // const visaClass = await fetchVisaClass();
    // const isReschedule = await checkReschedule();
    // setReschedule(isReschedule);
    // console.log(isReschedule);
    // const dependentsIDs = await fetchDependentIDs(
    //   primaryData.primaryID,
    //   isReschedule
    // );
    // console.log(primaryData);
    // console.log(dependentsIDs);
    // setUserQty(JSON.parse(dependentsIDs).length);
    // setVisaClass(visaClass);
    await fetchAllData();
  };

  const handlePushUser = async () => {
    // if (visaClass !== "B1" && visaClass !== "B2" && visaClass !== "B1/B2") {
    //   toast.error("Ineligible Visa Type");
    //   return;
    // }
    if (dependentsIDs === "") {
      toast.error("Data Incomplete, Can't Push");
      return;
    }
    const [checkResponse, checkAlreadyDone] = await Promise.all([
      fetch(`http://104.192.2.29:3000/users/${primaryID}`),
      fetch(`http://172.81.131.195:3000/stats/${primaryID}`)
    ]);
    
    if (checkResponse.ok) {
      toast.error("User Already Exists");
      return;
    }
    
    if (checkAlreadyDone.ok) {
      toast.error("User Already Booked");
      return;
    }
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

    const user = {
      name: primaryName,
      uid: UID,
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
      gapDays: parseInt(gapDays, 10),
      isRescheduleLater,
      priority: isPriority,
      preferredConsularLocation,
      contactId
    };

    try {
      const response0 = await fetch(`http://104.219.238.10:3000/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(extraData),
      });
      const response = await fetch(`http://104.192.2.29:3000/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result);
        toast.success("User Pushed Successfully");
      } else {
        toast.error("Failed to push user");
        console.error("Failed to push user, status:", response.status);
      }
    } catch (error) {
      console.error("Error pushing user:", error);
      toast.error("Error pushing user");
    }
  };

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

  const handleSetPreferredConsularLocation = (location) => {
    if (preferredConsularLocation === location)
      setPreferredConsularLocation("");
    else setPreferredConsularLocation(location);
    // else
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
          {primaryName !== "" ? primaryName : faker.person.fullName()}
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
        {["all", "chennai", "mumbai", "kolkata", "delhi", "hyderabad"].map(
          (city) => (
            <div
              key={city}
              onClick={() => handleCityChange(city)}
              className={`transition duration-150 rounded-full cursor-pointer px-3 py-2 rounded ${
                cities[city]
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700"
              } border ${cities[city] ? "border-red-500" : "border-gray-300"}`}
            >
              <span>{city.charAt(0).toUpperCase() + city.slice(1)}</span>
            </div>
          )
        )}
      </div>
      {sameConsular ? (
        <div className="city-container mt-6 flex flex-wrap gap-4">
          {["all", "chennai", "mumbai", "kolkata", "delhi", "hyderabad"].map(
            (city) => (
              <div
                key={city}
                className={`text-gray-300 transition duration-150 rounded-full cursor-pointer px-3 py-2 rounded border`}
                disabled
                onClick={() => handleConsularCityChange(city)}
              >
                <span>{city.charAt(0).toUpperCase() + city.slice(1)}</span>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="city-container mt-6 flex flex-wrap gap-4">
          {["all", "chennai", "mumbai", "kolkata", "delhi", "hyderabad"].map(
            (city) => (
              <div
                key={city}
                onClick={() => handleConsularCityChange(city)}
                className={`transition duration-150 rounded-full cursor-pointer px-3 py-2 rounded ${
                  consularCities[city]
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-700"
                } border ${
                  consularCities[city] ? "border-red-500" : "border-gray-300"
                }`}
              >
                <span>{city.charAt(0).toUpperCase() + city.slice(1)}</span>
              </div>
            )
          )}
        </div>
      )}

      <div className="flex flex-row gap-5">
        <div
          className={`same-consular-container px-5 transition duration-200 mt-5 rounded-full p-2 flex flex-row gap-2 items-center ${
            sameConsular ? "bg-green-200 shadow-lg" : ""
          }`}
          onClick={() => setSameConsular(!sameConsular)}
        >
          <p className="select-none">Same Consular?</p>
        </div>
        <div
          className={`same-consular-container px-5 transition duration-200 mt-5 rounded-full p-2 flex flex-row gap-2 items-center ${
            isOFCOnly ? "bg-red-200 shadow-lg" : ""
          }`}
          onClick={() => setIsOFCOnly(!isOFCOnly)}
        >
          <p className="select-none">OFC Only?</p>
        </div>

        <div
          className={`same-consular-container px-5 transition duration-200 mt-5 rounded-full p-2 flex flex-row gap-2 items-center ${
            isRescheduleLater ? "bg-blue-200 shadow-lg" : ""
          }`}
          onClick={() => setIsRescheduleLater(!isRescheduleLater)}
        >
          <p className="select-none">Reschedule Later?</p>
        </div>
      </div>

      <div className="agent flex flex-row gap-2 mt-5 h-16 items-center">
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
        <div className="location-pref-container flex flex-row flex-wrap w-32 gap-2 ml-5">
          <button
            onClick={() => handleSetPreferredConsularLocation("mumbai")}
            className={`w-12 px-2 text-xs h-6 rounded-full border border-gray-300 shadow-lg focus:outline-none transition-colors duration-300 ${
              preferredConsularLocation === "mumbai"
                ? "bg-blue-600 text-white"
                : "bg-white"
            }`}
          >
            BOM
          </button>
          <button
            onClick={() => handleSetPreferredConsularLocation("delhi")}
            className={`w-12 px-2 text-xs h-6 rounded-full border border-gray-300 shadow-lg focus:outline-none transition-colors duration-300 ${
              preferredConsularLocation === "delhi"
                ? "bg-red-600 text-white"
                : "bg-white"
            }`}
          >
            DEL
          </button>
          <button
            onClick={() => handleSetPreferredConsularLocation("kolkata")}
            className={`w-12 px-2 text-xs h-6 rounded-full border border-gray-300 shadow-lg focus:outline-none transition-colors duration-300 ${
              preferredConsularLocation === "kolkata"
                ? "bg-purple-600 text-white"
                : "bg-white"
            }`}
          >
            KOL
          </button>
          <button
            onClick={() => handleSetPreferredConsularLocation("hyderabad")}
            className={`w-12 px-2 text-xs h-6 rounded-full border border-gray-300 shadow-lg focus:outline-none transition-colors duration-300 ${
              preferredConsularLocation === "hyderabad"
                ? "bg-green-600 text-white"
                : "bg-white"
            }`}
          >
            HYD
          </button>
        </div>
      </div>
      <div className="agent-username-container mt-5 flex flex-row gap-8 justify-center">
        <div className="username">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="gap-container">
          <div className="flex space-x-2 mt-1">
            {[0, 1, 2, 3, 4, 5].map((day) => {
              const getColor = () => {
                const colors = [
                  "bg-green-500", // 0
                  "bg-green-400", // 1
                  "bg-yellow-300", // 2
                  "bg-yellow-400", // 3
                  "bg-orange-500", // 4
                  "bg-red-500", // 5
                ];
                return colors[day];
              };

              const getTextColor = () => {
                if (day >= 1 && day <= 3) {
                  return "text-black";
                }
                return "text-white";
              };

              return (
                <button
                  key={day}
                  onClick={() => setGapDays(day)}
                  className={`shadow-lg rounded-full border border-gray-300 px-3 transition duration-150 py-1 ${
                    gapDays === day
                      ? `${getColor()} ${getTextColor()}`
                      : "bg-white text-gray-700"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {day}
                </button>
              );
            })}
          </div>
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
          {/* <p>From</p> */}
          <DatePicker
            selected={earliestDate}
            onChange={(date) => setEarliestDate(date)}
            className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="date">
          {/* <p>To</p> */}
          <DatePicker
  selected={lastDate}
  onChange={(date) => setLastDate(date)}
  className="shadow-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  minDate={earliestDate}
  openToDate={earliestDate > new Date() ? earliestDate : undefined}
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
      <div className="flex flex-row gap-4 mt-3">
      <button
        onClick={setLastDateCurrentMonth}
        className="btn bg-blue-500 text-white rounded-md px-3 py-1 shadow-md outline-none hover:bg-blue-600 transition duration-200"
      >
        Set Current Month
      </button>
      <button
        onClick={setLastDateNextMonth}
        className="btn bg-blue-600 text-white rounded-md px-3 py-1 shadow-md outline-none hover:bg-green-600 transition duration-200"
      >
        Set Next Month
      </button>
    </div>
      <div className="fill-btn flex flex-row gap-4 mt-4">
        <button
          id="fill-btn"
          onClick={handleFill}
          className="btn bg-blue-600 text-white rounded-md px-3 py-2 shadow-md outline-none hover:bg-blue-700 transition duration-200"
        >
          Fill Data
        </button>
        <button
          id="push-btn"
          onClick={handlePushUser}
          className={`btn ${
            dependentsIDs === ""
              ? "bg-gray-600"
              : "bg-green-600 hover:bg-green-700 transition duration-200"
          } text-white rounded-md px-3 py-2 shadow-md outline-none`}
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
          className="btn bg-red-600 text-white rounded-md px-3 py-2 shadow-md outline-none hover:bg-red-700 transition duration-200"
        >
          Reset Dates
        </button>
      </div>
      <ToastContainer autoClose={1500} />
    </div>
  );
}

export default App;
