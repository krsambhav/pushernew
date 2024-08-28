import React, { useState } from "react";
import { load } from "cheerio";

const HtmlToJsonExtractor = (html) => {
  let jsonData;
  const handleExtractJson = (html) => {
    const extractApplicantDataFromHTML = (html) => {
      const $ = load(html);
      const cleanText = (text) => text.replace(/\s\s+/g, " ").trim();
      const applicants = [];

      const uidRegex =
        /https:\/\/barcodes\.cgiatlas\.com\/barcode\/code128\/(\d+)/g;
      const uids = [];
      let match;
      while ((match = uidRegex.exec(html)) !== null) {
        uids.push(match[1]);
      }

      const numberOfApplicants = parseInt(
        cleanText(
          $('tr:contains("Number of Applicants") td:nth-child(2)').text().trim()
        )
      );

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
          uid: uids[index * 1] || "",
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

      const deliveryDetails = {
        type: cleanText(
          $('tr:contains("Document Delivery Type") td:nth-child(2)')
            .first()
            .text()
            .trim()
        ),
      };

      if (deliveryDetails.type !== "Premium Delivery") {
        deliveryDetails.locationName = cleanText(
          $('tr:contains("Location Name") td:nth-child(2)')
            .first()
            .text()
            .trim()
        );
        deliveryDetails.address1 = cleanText(
          $('tr:contains("Address 1") td:nth-child(2)').first().text().trim()
        );
        deliveryDetails.address2 = cleanText(
          $('tr:contains("Address 2") td:nth-child(2)').first().text().trim()
        );
        deliveryDetails.city = cleanText(
          $('tr:contains("City:") td:nth-child(2)').first().text().trim()
        );
        deliveryDetails.postalCode = cleanText(
          $('tr:contains("Postal Code:") td:nth-child(2)')
            .eq(numberOfApplicants * 2)
            .text()
            .trim()
        );
      } else if (deliveryDetails.type === "Premium Delivery") {
        deliveryDetails.street = cleanText(
          $('tr:contains("Mailing Street:") td:nth-child(2)')
            .first()
            .text()
            .trim()
        );
        deliveryDetails.city = cleanText(
          $('tr:contains("Mailing City:") td:nth-child(2)')
            .first()
            .text()
            .trim()
        );
        deliveryDetails.state = cleanText(
          $('tr:contains("Mailing State:") td:nth-child(2)')
            .first()
            .text()
            .trim()
        );
        deliveryDetails.postalCode = cleanText(
          $('tr:contains("Mailing Postal Code:") td:nth-child(2)')
            .eq(0)
            .text()
            .trim()
        );
      }

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

      for (let i = 0; i < numberOfApplicants; i++) {
        let applicant;

        if (i === 0) {
          const primarySection = $('h2:contains("PRIMARY APPLICANT DETAILS")')
            .next()
            .next()
            .find("table.section");
          applicant = extractApplicant(primarySection, i);
        } else {
          const familySection = $('h2:contains("FAMILY/GROUP MEMBERS")')
            .next()
            .next()
            .find("table.section")
            .eq(i - 1);
          applicant = extractApplicant(familySection, i);
        }

        applicant.delivery = deliveryDetails;
        applicant.mrvFee = {
          ...mrvFeeDetails,
          receipt: mrvFeeDetails.receipt.replace(/-(\d+)$/, `-${i + 1}`),
        };

        applicants.push(applicant);
      }

      return applicants;
    };

    jsonData = extractApplicantDataFromHTML(html);
    console.log(jsonData);
  };

  handleExtractJson(html);
  console.log(jsonData);
  return jsonData;
};

export default HtmlToJsonExtractor;
