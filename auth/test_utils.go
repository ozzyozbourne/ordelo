package main

import (
	"fmt"
	"log"
	"math/rand"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func generateRandowEmails() string {
	b := make([]byte, 5)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz0123456789"[rand.Intn(36)]
	}
	return fmt.Sprintf("%s@test.com", string(b))
}

func generateRandowName() string {
	b := make([]byte, 5)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz"[rand.Intn(26)]
	}
	return fmt.Sprintf("%s tester", string(b))
}

func generateIngredientsArray(n int) []*Ingredient {
	genRandIngredient := func() string {

		vegetables := []string{
			"Tomato", "Onion", "Garlic", "Bell Pepper", "Carrot", "Broccoli",
			"Spinach", "Kale", "Cucumber", "Zucchini", "Mushroom", "Potato",
			"Sweet Potato", "Eggplant", "Cauliflower", "Asparagus", "Green Bean",
			"Corn", "Peas", "Leek", "Celery", "Cabbage", "Brussels Sprout",
		}
		proteins := []string{
			"Chicken Breast", "Beef", "Pork", "Tofu", "Tempeh", "Salmon",
			"Tuna", "Shrimp", "Lentils", "Chickpeas", "Black Beans", "Ground Turkey",
			"Lamb", "Eggs", "Bacon", "Sausage", "Ham", "Duck", "Crab Meat",
			"Lobster", "Scallops", "Almonds", "Walnuts", "Peanuts", "Cashews",
		}
		grains := []string{
			"Rice", "Pasta", "Quinoa", "Couscous", "Barley", "Oats",
			"Bread Crumbs", "Flour", "Cornmeal", "Tortilla", "Noodles", "Pita Bread",
			"Bulgur Wheat", "Farro", "Polenta", "Millet", "Wild Rice", "Brown Rice",
		}
		dairy := []string{
			"Milk", "Butter", "Cheese", "Yogurt", "Cream", "Sour Cream",
			"Cream Cheese", "Mozzarella", "Parmesan", "Cheddar", "Goat Cheese", "Feta",
			"Ricotta", "Mascarpone", "Brie", "Blue Cheese", "Heavy Cream", "Buttermilk",
		}
		spices := []string{
			"Salt", "Pepper", "Cumin", "Paprika", "Cinnamon", "Oregano",
			"Basil", "Thyme", "Rosemary", "Chili Powder", "Ginger", "Turmeric",
			"Nutmeg", "Cardamom", "Cloves", "Bay Leaf", "Curry Powder", "Coriander",
			"Mustard Seed", "Saffron", "Fennel Seed", "Allspice", "Vanilla",
		}
		fruits := []string{
			"Lemon", "Lime", "Orange", "Apple", "Pear", "Banana",
			"Strawberry", "Blueberry", "Raspberry", "Mango", "Pineapple", "Coconut",
			"Avocado", "Cherry", "Watermelon", "Grape", "Pomegranate", "Fig",
			"Dates", "Raisins", "Cranberry", "Grapefruit", "Peach", "Plum",
		}
		oils := []string{
			"Olive Oil", "Vegetable Oil", "Canola Oil", "Sesame Oil", "Coconut Oil",
			"Peanut Oil", "Sunflower Oil", "Grapeseed Oil", "Avocado Oil", "Walnut Oil",
		}

		allIngredients := []string{}
		allIngredients = append(allIngredients, vegetables...)
		allIngredients = append(allIngredients, proteins...)
		allIngredients = append(allIngredients, grains...)
		allIngredients = append(allIngredients, dairy...)
		allIngredients = append(allIngredients, spices...)
		allIngredients = append(allIngredients, fruits...)
		allIngredients = append(allIngredients, oils...)

		return allIngredients[rand.Intn(len(allIngredients))]
	}

	var res []*Ingredient
	for _ = range n {
		val := &Ingredient{
			IngredientID: bson.NewObjectID(),
			Name:         genRandIngredient(),
			Quantity:     (rand.Float64() + 1) * 100,
			Unit:         []string{"kg", "g", "mg", "litre", "ml"}[rand.Intn(5)],
		}

		res = append(res, val)
	}
	return res
}

func generateRecipesArray(n int) []*Recipe {
	generateRandomTitle := func() string {

		adjectives := []string{
			"Homemade", "Classic", "Spicy", "Savory", "Sweet", "Tangy", "Creamy",
			"Crispy", "Roasted", "Grilled", "Baked", "Slow-Cooked", "Pan-Fried",
			"Sautéed", "Hearty", "Fresh", "Traditional", "Zesty", "Gourmet", "Quick",
			"Ultimate", "Easy", "Rustic", "Family-Style", "Seasonal", "Wholesome",
		}
		dishTypes := []string{
			"Pasta", "Soup", "Stew", "Salad", "Casserole", "Stir-Fry", "Curry",
			"Tacos", "Burgers", "Pizza", "Sandwich", "Risotto", "Pilaf", "Bowl",
			"Bake", "Skillet", "Noodles", "Chili", "Pie", "Roast", "Dumplings",
			"Grill", "Paella", "Frittata", "Meatballs", "Lasagna", "Pot Pie",
		}
		cuisines := []string{
			"Italian", "Mexican", "Thai", "Indian", "Chinese", "Mediterranean",
			"French", "Japanese", "Korean", "Greek", "Moroccan", "Lebanese",
			"Spanish", "American", "Vietnamese", "Brazilian", "Turkish", "Cajun",
		}

		adjRandIndex := rand.Intn(len(adjectives))
		disRandIndex := rand.Intn(len(dishTypes))
		cuiRandIndex := rand.Intn(len(cuisines))

		return fmt.Sprintf("%s %s %s", adjectives[adjRandIndex], cuisines[cuiRandIndex], dishTypes[disRandIndex])

	}

	generateRandonDescription := func() string {
		intros := []string{
			"A delicious meal that's perfect for any occasion.",
			"This flavorful dish combines the best seasonal ingredients.",
			"An easy recipe that's sure to become a family favorite.",
			"A comforting dish that's ready in under 30 minutes.",
			"This recipe transforms simple ingredients into something spectacular.",
			"A hearty dish that's both nutritious and satisfying.",
			"This crowd-pleasing recipe is perfect for entertaining.",
			"A versatile dish that can be customized to your taste.",
			"This simple yet elegant dish is perfect for weeknight dinners.",
			"A colorful and nutritious meal that's full of flavor.",
			"This classic recipe has stood the test of time for good reason.",
			"A quick and easy meal that doesn't compromise on flavor.",
			"This impressive dish is surprisingly simple to prepare.",
		}
		methods := []string{
			"Slow-cooked to perfection, allowing the flavors to meld together beautifully.",
			"Made with fresh ingredients that create a burst of flavor in every bite.",
			"Prepared using a traditional technique that enhances the natural flavors.",
			"Cooked with care to ensure the perfect texture and taste balance.",
			"Seasoned with a carefully selected blend of herbs and spices.",
			"Featuring a unique combination of textures and complementary flavors.",
			"Created with simplicity in mind, letting the quality ingredients shine.",
			"Balanced with sweet, savory, and aromatic elements that work in harmony.",
			"Finished with a special touch that elevates this dish to the next level.",
		}
		serving := []string{
			"Serve hot with your favorite side for a complete meal.",
			"Perfect for sharing with friends and family.",
			"Enjoy with a glass of wine for the ultimate dining experience.",
			"Garnish with fresh herbs just before serving for added flavor.",
			"Can be prepared ahead of time and reheated when needed.",
			"Leftovers taste even better the next day as flavors continue to develop.",
			"Pairs wonderfully with a crisp salad or crusty bread.",
			"Makes excellent leftovers for lunch the following day.",
			"Great for meal prep and can be frozen for future meals.",
		}

		randIntro := rand.Intn(len(intros))
		randMethods := rand.Intn(len(methods))
		randServing := rand.Intn(len(serving))

		return fmt.Sprintf("%s %s %s", intros[randIntro], methods[randMethods], serving[randServing])
	}
	var res []*Recipe
	for _ = range n {
		val := &Recipe{
			ID:              bson.NewObjectID(),
			Title:           generateRandomTitle(),
			Ingredients:     generateIngredientsArray(10),
			Description:     generateRandonDescription(),
			PreparationTime: rand.Intn(10) + 1,
			ServingSize:     rand.Intn(10) + 1,
		}
		res = append(res, val)

	}
	return res
}

func generateRandomAddress() string {
	streetNames := []string{"Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Washington", "Lake", "Hill",
		"Park", "River", "Meadow", "Forest", "Spring", "Sunset", "Highland", "Valley", "Mountain"}

	streetTypes := []string{"St", "Ave", "Blvd", "Rd", "Ln", "Dr", "Way", "Pl", "Ct"}

	cities := []string{"Springfield", "Franklin", "Greenville", "Bristol", "Clinton", "Salem",
		"Georgetown", "Arlington", "Burlington", "Manchester", "Oxford", "Riverside", "Kingston"}

	states := []string{"AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL",
		"IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
		"NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
		"UT", "VT", "VA", "WA", "WV", "WI", "WY"}

	countries := []string{"USA", "Chile", "China", "India", "Mexico", "Australia"}

	a := &struct {
		StreetNumber string
		StreetName   string
		StreetType   string
		City         string
		State        string
		ZipCode      string
		Country      string
	}{
		StreetNumber: fmt.Sprintf("%d", rand.Intn(9999)+1),
		StreetName:   streetNames[rand.Intn(len(streetNames))],
		StreetType:   streetTypes[rand.Intn(len(streetTypes))],
		City:         cities[rand.Intn(len(cities))],
		State:        states[rand.Intn(len(states))],
		ZipCode:      fmt.Sprintf("%05d", rand.Intn(100000)),
		Country:      countries[rand.Intn(len(countries))],
	}

	return fmt.Sprintf("%s %s %s, %s, %s %s, %s",
		a.StreetNumber, a.StreetName, a.StreetType,
		a.City, a.State, a.ZipCode, a.Country)
}

func checkUserStructs(user_in, user_out *User) (err error) {
	if user_in.ID != user_out.ID {
		return fmt.Errorf("UserID are not the same %v %v", user_in.ID, user_out.ID)
	}

	if user_in.UserName != user_out.UserName {
		return fmt.Errorf("UserName mismatch: %q vs %q", user_in.UserName, user_out.UserName)
	}

	if user_in.UserAddress != user_out.UserAddress {
		return fmt.Errorf("UserAddress mismatch: %q vs %q", user_in.UserAddress, user_out.UserAddress)
	}

	if user_in.Email != user_out.Email {
		return fmt.Errorf("Email mismatch: %q vs %q", user_in.Email, user_out.Email)
	}

	if user_in.PasswordHash != user_out.PasswordHash {
		return fmt.Errorf("PasswordHash mismatch: %q vs %q", user_in.PasswordHash, user_out.PasswordHash)
	}

	if user_in.Role != user_out.Role {
		return fmt.Errorf("Role mismatch: %q vs %q", user_in.Role, user_out.Role)
	}

	if len(user_in.SavedRecipes) != len(user_out.SavedRecipes) {
		return fmt.Errorf("SavedRecipes length mismatch: %d vs %d",
			len(user_in.SavedRecipes), len(user_out.SavedRecipes))
	}

	for i, recipe_in := range user_in.SavedRecipes {
		recipe_out := user_out.SavedRecipes[i]

		if recipe_in == nil && recipe_out == nil {
			continue
		}
		if recipe_in == nil || recipe_out == nil {
			return fmt.Errorf("Recipe at index %d: one is nil, other is not", i)
		}

		if recipe_in.ID != recipe_out.ID {
			return fmt.Errorf("Recipe[%d].ID mismatch: %v vs %v", i, recipe_in.ID, recipe_out.ID)
		}

		if recipe_in.Title != recipe_out.Title {
			return fmt.Errorf("Recipe[%d].Title mismatch: %q vs %q", i, recipe_in.Title, recipe_out.Title)
		}

		if recipe_in.Description != recipe_out.Description {
			return fmt.Errorf("Recipe[%d].Description mismatch: %q vs %q",
				i, recipe_in.Description, recipe_out.Description)
		}

		if recipe_in.PreparationTime != recipe_out.PreparationTime {
			return fmt.Errorf("Recipe[%d].PreparationTime mismatch: %d vs %d",
				i, recipe_in.PreparationTime, recipe_out.PreparationTime)
		}

		if recipe_in.ServingSize != recipe_out.ServingSize {
			return fmt.Errorf("Recipe[%d].ServingSize mismatch: %d vs %d",
				i, recipe_in.ServingSize, recipe_out.ServingSize)
		}

		if len(recipe_in.Ingredients) != len(recipe_out.Ingredients) {
			return fmt.Errorf("Recipe[%d].Ingredients length mismatch: %d vs %d",
				i, len(recipe_in.Ingredients), len(recipe_out.Ingredients))
		}

		for j, ing_in := range recipe_in.Ingredients {
			ing_out := recipe_out.Ingredients[j]

			if ing_in == nil && ing_out == nil {
				continue
			}
			if ing_in == nil || ing_out == nil {
				return fmt.Errorf("Recipe[%d].Ingredient[%d]: one is nil, other is not", i, j)
			}

			if ing_in.IngredientID != ing_out.IngredientID {
				return fmt.Errorf("Recipe[%d].Ingredient[%d].IngredientID mismatch: %v vs %v",
					i, j, ing_in.IngredientID, ing_out.IngredientID)
			}

			if ing_in.Name != ing_out.Name {
				return fmt.Errorf("Recipe[%d].Ingredient[%d].Name mismatch: %q vs %q",
					i, j, ing_in.Name, ing_out.Name)
			}

			if ing_in.Quantity != ing_out.Quantity {
				return fmt.Errorf("Recipe[%d].Ingredient[%d].Quantity mismatch: %f vs %f",
					i, j, ing_in.Quantity, ing_out.Quantity)
			}

			if ing_in.Unit != ing_out.Unit {
				return fmt.Errorf("Recipe[%d].Ingredient[%d].Unit mismatch: %q vs %q",
					i, j, ing_in.Unit, ing_out.Unit)
			}
		}
	}

	return nil
}
