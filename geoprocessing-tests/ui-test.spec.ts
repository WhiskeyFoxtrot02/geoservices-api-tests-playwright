import dotenv from "dotenv";
import { test, expect } from "@playwright/test";



var path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../ui.env") });



test("Create local geoservices website and check title", async ({ page }) => {

    await page.goto("localhost:4200");

    await expect(page).toHaveTitle(/GeoServices/i);

});

test("Open online geoservices website and attempt login", async ({ page }) => {

    //Get username and password from ui.env file
    let userenv = process.env["userenv"] || "demo";
    let passenv = process.env["passenv"] || "demo";
    
    await page.goto("https://geoservices-k8s.geoservices.tamu.edu/Login/");

    // Fill in username and password
    await page.reload();
    await page.fill('input[id="ctl00_ContentPlaceHolderBody_txtUserName"]', userenv);
    await page.fill('input[id="ctl00_ContentPlaceHolderBody_txtPassword"]', passenv);

    // Submit login attempt and accept use policy
    await page.click('input[id="ctl00_ContentPlaceHolderBody_btnSubmit"]');
    await page.click('input[value="Agree"]');

    await expect(page).toHaveTitle(/GeoServices/i);

});

test("Create local geoservices website and navigate to Pricing", async ({ page }) => {

    await page.goto("localhost:4200");

    await page.getByTestId("close").click();

    await page.click('li[data-testid="pricing-option"]');
    
    await expect(page).toHaveURL(/.*\/pricing/);

});


test("Create local geoservices website and navigate to Contact Us", async ({ page }) => {

    await page.goto("localhost:4200");

    await page.getByTestId("close").click();

    await page.locator('[data-testid="support-dropdown-toggle"]').hover();

    await page.locator('[data-testid="contact-us-option"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="contact-us-option"]').click();
    
    await expect(page).toHaveURL(/.*\/contact/);

});