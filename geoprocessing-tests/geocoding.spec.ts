import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import fs from "fs";

import { testAttribute } from "../utils/attribute-matcher";

import { test, expect } from "@playwright/test";

var path = require("path");

//Get .csv file name and estabish a connection to the desired .csv file for the list of domains to test
//NOTE: As of current version, the first Domain listed will be used as the base for all other domains to be tested against.
const domainCSVlocation = "../data/URL-domains.csv";
const addressCSVlocation = "../data/address-processing-addresses.csv";

const domainsCSV = parse(fs.readFileSync(path.join(__dirname, domainCSVlocation), 'utf8'),{
  //Insert desired .csv formatting parameters.
});
const addressesCSV = parse(fs.readFileSync(path.join(__dirname, addressCSVlocation), 'utf8'),{
  //Insert desired .csv formatting parameters.
  columns: true //Sets first row of .csv to be the names of each column
  /*
    Proper .csv header format:
    Name,URLaddress,num_of_attributes,attribute1_name,attribute1_location,attribute2_name,attribute2_location... ,attributeX_name,attributeX_location
  */
});

dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log(`Loaded ${addressesCSV.length} geocoding test categories`);

test.describe("Geocoding Tests", () => {
  // Dynamically create test suites for each row in the .csv
  addressesCSV.forEach((row) => {
    test.describe(row['Name'], () => {
      test.beforeAll(() => {
        console.log(`Starting ${row['Name']} test`);
      });

      // Create individual tests for each attribute case in the row
      for(let iter: number = 0; iter < row['num_of_attributes']; iter+=1){
        const testName = row["attribute"+(iter+1)+"_name"]; //testName = name of attribute being tested (ex: logitude, latitude)
        const testLocation = row["attribute"+(iter+1)+"_location"] //testLocation = location of data being tested in the API;
        test(`${testName} - Test ${iter + 1}:`, async ({
          page,
        }) => {

          const domains: Array<string> = domainsCSV[0];
          const apiKey = process.env.API_KEY || "demo";
          let responses: number[] = [];
          for(const domain of domains){
            
            // Append the API Key query param to the query URL. Pull this from your environment variables and default to 'demo' test key.
            // console.log(process.env);
            const fullQuery = domain+row["URLaddress"];
            //console.log(fullQuery);
            const queryWithApiKey = new URL(fullQuery);
            queryWithApiKey.searchParams.append("apikey", apiKey);

            // DEBUG:
            // Log the full query URL for debugging
            // console.log(`query URL: ${queryWithApiKey.toString()}`);

            // Make the geocoding API request
            const response = await page.request.get(queryWithApiKey.toString());

            // Test for 200 OK response. This doesn't guarantee the query is valid, but it's a good start.
            expect(response.ok()).toBeTruthy();

            // Because GSVCS API's don't conform exactly to any standard, the request might return a 200 OK status even if the query is invalid or returns no results.
            // So we check the status code explicitly
            const responseData = await response.json();
            
            // Basic validation - you can expand this based on your requirements
            expect(responseData).toBeDefined();

            // Add the response to a running array of all queries
            responses.push(responseData);
          }

          // Check if current URL has attributes to test. If none, skip the testing and assume truthy response.
          let testResults: boolean[] = [];
          if (row["num_of_attributes"] > 0){   
            for (const index in responses){
              testResults.push(
                testAttribute(
                  responses[0], //Set as the expectation for responses[index]
                  responses[index], //Currently tested response
                  domains[index], //Provides name of which domain in being tested
                  testLocation //Provide path to data to be tested
                )
              )
            }
            for(const result of testResults){ //Test all results to be true. 
              expect(result).toBeTruthy();
            }
          } else {
            console.log(
              "No attribute matchers defined for this test case, skipping validation."
            );
          }

          // Log test completion
          console.log(`Completed test: ${testName}`);
        });
      };
    });
  });
});