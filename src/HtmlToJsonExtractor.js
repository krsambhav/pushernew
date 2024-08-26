import React, { useState } from "react";
import { load } from "cheerio";

const HtmlToJsonExtractor = (html) => {
  let jsonData;
  console.log(html);
  const handleExtractJson = (html) => {
    const extractApplicantDataFromHTML = (html) => {
      const $ = load(html);
      const cleanText = (text) => text.replace(/\s\s+/g, " ").trim();
      const applicants = [];

      // Regex to extract all UIDs from barcode URLs
      const uidRegex =
        /https:\/\/barcodes\.cgiatlas\.com\/barcode\/code128\/(\d+)/g;
      const uids = [];
      let match;
      // Make sure to extract all matches by resetting the regex state properly
      while ((match = uidRegex.exec(html)) !== null) {
        uids.push(match[1]);
      }

      console.log("Extracted UIDs:", uids); // Debugging output to check UIDs

      // Extract the number of applicants
      const numberOfApplicants = parseInt(
        cleanText(
          $('tr:contains("Number of Applicants") td:nth-child(2)').text().trim()
        )
      );

      // Function to extract individual applicant details
      const extractApplicant = (section, index) => {
        const passportRaw = cleanText(
          $(section)
            .find('td:contains("Passport Number:")')
            .next()
            .find("div")
            .text()
            .trim()
        );
        const passport = passportRaw.includes("****")
          ? passportRaw
          : passportRaw.split(" ")[0];

        return {
          uid: uids[index * 1] || "", // 1st match for 1st applicant, 3rd match for 2nd applicant, etc.
          name:
            cleanText(
              $(section)
                .find('tr:contains("Appointment(s) Made By:") td:nth-child(2)')
                .text()
                .trim()
            ) ||
            cleanText(
              $(section)
                .find('tr:contains("Applicant Name:") td:nth-child(2)')
                .text()
                .trim()
            ),
          passport: passport,
          ds160: cleanText(
            $(section)
              .find(
                'tr:contains("DS-160 Confirmation Number:") td:nth-child(2)'
              )
              .text()
              .trim()
          ),
          visaClass: cleanText(
            $(section)
              .find('tr:contains("Visa Class:") td:nth-child(2)')
              .text()
              .trim()
          ),
          visaCategory: cleanText(
            $(section)
              .find('tr:contains("Visa Category:") td:nth-child(2)')
              .text()
              .trim()
          ),
          visaPriority: cleanText(
            $(section)
              .find('tr:contains("Visa Priority:") td:nth-child(2)')
              .text()
              .trim()
          ),
        };
      };

      const ofcAppointmentDetails = (index) => ({
        number: (index + 1).toString(),
        location: cleanText(
          $('tr:contains("Embassy/Consulate/OFC") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        address1: cleanText(
          $('tr:contains("Street Address") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        address2: cleanText(
          $('tr:contains("Street Address Cont.") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        city: cleanText(
          $('tr:contains("City, Postal Code") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        date: cleanText(
          $('tr:contains("OFC Appointment Date") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
      });

      const consularAppointmentDetails = (index) => ({
        number: (index + 1).toString(),
        location: cleanText(
          $('tr:contains("Embassy/Consulate/OFC") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        address1: cleanText(
          $('tr:contains("Street Address") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        address2: cleanText(
          $('tr:contains("Street Address Cont.") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        city: cleanText(
          $('tr:contains("City, Postal Code") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        date: cleanText(
          $('tr:contains("Consular Appointment Date") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
      });

      const deliveryDetails = {
        type: cleanText(
          $('tr:contains("Document Delivery Type") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        locationName: cleanText(
          $('tr:contains("Location Name") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        address1: cleanText(
          $('tr:contains("Address 1") td:nth-child(2)').first().text().trim()
        ),
        address2: cleanText(
          $('tr:contains("Address 2") td:nth-child(2)').first().text().trim()
        ),
        city: cleanText(
          $('tr:contains("City") td:nth-child(2)').first().text().trim()
        ),
        postalCode: cleanText(
          $('tr:contains("Postal Code") td:nth-child(2)').first().text().trim()
        ),
      };

      const mrvFeeDetails = {
        receipt: cleanText(
          $('tr:contains("Receipt Number") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
        amount: cleanText(
          $('tr:contains("Amount") td:nth-child(2)').first().text().trim()
        ),
      };

      // Extract details for each applicant
      for (let i = 0; i < numberOfApplicants; i++) {
        let applicant;

        if (i === 0) {
          // Primary Applicant details extraction
          const primarySection = $('h2:contains("PRIMARY APPLICANT DETAILS")')
            .next()
            .next()
            .find("table.section");
          applicant = extractApplicant(primarySection, i);
        } else {
          // Family/Group Member details extraction
          const familySection = $('h2:contains("FAMILY/GROUP MEMBERS")')
            .next()
            .next()
            .find("table.section")
            .eq(i - 1);
          applicant = extractApplicant(familySection, i);
        }

        // Assign the extracted details
        applicant.ofcAppointment = ofcAppointmentDetails(i);
        applicant.consularAppointment = consularAppointmentDetails(i);
        applicant.delivery = deliveryDetails;
        applicant.mrvFee = {
          ...mrvFeeDetails,
          receipt: mrvFeeDetails.receipt.replace(/-(\d+)$/, `-${i + 1}`), // Adjust the receipt number here
        };

        applicants.push(applicant);
      }

      return applicants;
    };

    jsonData = extractApplicantDataFromHTML(html);
  };
  handleExtractJson(html);
  console.log(jsonData);
  return jsonData;
};

export default HtmlToJsonExtractor;
