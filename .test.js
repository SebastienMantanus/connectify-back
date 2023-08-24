// import routes
const affiliatesRoutes = require("./routes/affiliates");

// import matchers
const matchers = require("jest-extended");
expect.extend(matchers);

// import supertest
const request = require("supertest");

// test de la route
test("Pappers API test", async () => {
  const GetAffiliatesResponse = await request(affiliatesRoutes).get(
    "/affiliate/create/autocomplete?q=CFI CONSEIL"
  );

  expect(GetAffiliatesResponse.statusCode).toBe(200);
  expect(GetAffiliatesResponse.body).toBeArray();

  // objects list in array
  if (GetAffiliatesResponse.body.length > 0) {
    console.log("on est dans la boucle");
    expect(GetAffiliatesResponse.body[0]).toBeObject();
    expect(GetAffiliatesResponse.body[0]).toContainAllKeys([
      "company_name",
      "company_legalform",
      "company_address",
      "company_zip",
      "company_city",
      "company_size_min",
      "company_size_max",
      "company_capital",
      "company_activity",
      "company_founded",
      "company_registration_number",
      //   "Gwen_est_géniale",
    ]);
    // faire une boucle pour tester tous les objets du tableau et vérifier qu'il ne soient pas undifined
    const tabOfKeys = Object.keys(GetAffiliatesResponse.body[0]);
    for (let i = 0; i < tabOfKeys.length; i++) {
      expect(GetAffiliatesResponse.body[0][tabOfKeys[i]]).not.toBeUndefined();
    }
  }
});

// $$$$$ KIF DE SEB $$$$$$$ - myModule function
const myModule = (a, b) => a + b;

test("adds 1 + 2 to equal 3", () => {
  expect(myModule(1, 2)).toBe(3);
  expect(myModule(1, 2)).toBeNumber();
});
