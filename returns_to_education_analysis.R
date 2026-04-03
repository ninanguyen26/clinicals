# Returns to Education - Regression Analysis
# CPS1988 Dataset from AER Package
# Analysis of wage returns to education with various specifications

# Install packages if needed
# install.packages("AER")
# install.packages("lmtest")
# install.packages("sandwich")

library(AER)
library(lmtest)
library(sandwich)

# Load the CPS1988 dataset
data("CPS1988")

# Explore the data
head(CPS1988)
summary(CPS1988)
str(CPS1988)

# Create log(wage) variable
CPS1988$log_wage <- log(CPS1988$wage)

# ==============================================================================
# QUESTION A: Part-time vs Full-time Worker Wages
# ==============================================================================
cat("\n======== QUESTION A: Part-time vs Full-time Wages ========\n")

# Regression: log(wage) on parttime dummy
model_a <- lm(log_wage ~ parttime, data = CPS1988)
summary(model_a)

cat("\nINTERPRETATION A:\n")
cat("The coefficient on 'parttime' indicates whether part-time workers earn\n")
cat("more or less than full-time workers, holding other factors constant.\n")
cat("If negative: part-time workers earn LESS than full-time workers\n")
cat("If positive: part-time workers earn MORE than full-time workers\n")
cat("The coefficient represents the % change in wages (since dependent variable is log(wage))\n")

# Extract and display the part-time coefficient
pt_coef <- coef(model_a)["parttimeYes"]
cat("\nPart-time coefficient:", round(pt_coef, 4), "\n")
cat("Interpretation: Part-time workers earn", round(pt_coef*100, 2),
    "% less than full-time workers\n")


# ==============================================================================
# QUESTION B: Does education effect vary between part-time and full-time?
# ==============================================================================
cat("\n\n======== QUESTION B: Education Effect by Work Status ========\n")

# Regression with interaction term: education * parttime
model_b <- lm(log_wage ~ education + parttime + education:parttime, data = CPS1988)
summary(model_b)

cat("\nINTERPRETATION B:\n")
cat("The interaction term 'education:parttimeYes' tests whether the return to\n")
cat("one additional year of education differs for part-time vs full-time workers.\n")

# Extract coefficients
edu_coef_ft <- coef(model_b)["education"]
edu_coef_pt_diff <- coef(model_b)["education:parttimeYes"]

cat("\nEducation return for FULL-TIME workers:", round(edu_coef_ft, 4), "\n")
cat("This means each year of education increases wages by",
    round(edu_coef_ft*100, 2), "% for full-time workers\n")

cat("\nDifference in education return for PART-TIME vs FULL-TIME:",
    round(edu_coef_pt_diff, 4), "\n")

if(abs(edu_coef_pt_diff) < 0.01) {
  cat("This is very small, suggesting education effect is similar for both groups\n")
} else {
  cat("Part-time workers' education return differs by",
      round(edu_coef_pt_diff*100, 2), "% compared to full-time\n")
}

# Test if interaction is significant
cat("\nP-value for interaction term:", round(summary(model_b)$coefficients[4,4], 4), "\n")


# ==============================================================================
# QUESTION C: Do wages vary across regions? Which region pays most?
# ==============================================================================
cat("\n\n======== QUESTION C: Regional Wage Variation ========\n")

# Regression: log(wage) on region
model_c <- lm(log_wage ~ region, data = CPS1988)
summary(model_c)

cat("\nINTERPRETATION C:\n")
cat("The regression includes region indicators (midwest, south, west).\n")
cat("Reference category is 'northeast' (the omitted region).\n")

# Calculate predicted wages by region (holding other things constant)
region_names <- levels(CPS1988$region)
region_effects <- c(0, coef(model_c)[grepl("region", names(coef(model_c)))])
names(region_effects) <- region_names

intercept <- coef(model_c)[1]
region_log_wages <- intercept + region_effects

cat("\nPredicted log(wage) by region:\n")
print(region_log_wages)

cat("\nPredicted wage levels (in dollars per hour) by region:\n")
region_wages <- exp(region_log_wages)
print(region_wages)

highest_region <- region_names[which.max(region_log_wages)]
cat("\nRegion with HIGHEST wages:", highest_region, "\n")


# ==============================================================================
# QUESTION D: Does education effect vary by region?
# ==============================================================================
cat("\n\n======== QUESTION D: Education Effect by Region ========\n")

# Regression with education interaction with region
model_d <- lm(log_wage ~ education * region, data = CPS1988)
summary(model_d)

cat("\nINTERPRETATION D:\n")
cat("The interaction terms 'education:region[X]' test whether the return to\n")
cat("education differs across regions.\n")

# Extract education coefficients for each region
edu_northeast <- coef(model_d)["education"]
edu_midwest <- edu_northeast + coef(model_d)["education:regionmidwest"]
edu_south <- edu_northeast + coef(model_d)["education:regionsouth"]
edu_west <- edu_northeast + coef(model_d)["education:regionwest"]

cat("\nReturn to one year of education by region:\n")
cat("Northeast:", round(edu_northeast, 4), "(reference category)\n")
cat("Midwest:  ", round(edu_midwest, 4), "\n")
cat("South:    ", round(edu_south, 4), "\n")
cat("West:     ", round(edu_west, 4), "\n")

cat("\nIn percentage terms:\n")
cat("Northeast:", round(edu_northeast*100, 2), "% per year of education\n")
cat("Midwest:  ", round(edu_midwest*100, 2), "% per year of education\n")
cat("South:    ", round(edu_south*100, 2), "% per year of education\n")
cat("West:     ", round(edu_west*100, 2), "% per year of education\n")

# Test if interaction is jointly significant
cat("\nF-test for joint significance of regional interaction terms:\n")
model_d_restricted <- lm(log_wage ~ education + region, data = CPS1988)
anova(model_d_restricted, model_d)


# ==============================================================================
# QUESTION E: Experience and wage dynamics
# ==============================================================================
cat("\n\n======== QUESTION E: Experience Effect on Wages ========\n")

# Create experience squared variable
CPS1988$experience_sq <- CPS1988$experience^2

# Regression: log(wage) on education, experience, experience^2, and parttime
model_e <- lm(log_wage ~ education + experience + experience_sq + parttime, data = CPS1988)
summary(model_e)

cat("\nINTERPRETATION E:\n")
cat("This model includes a quadratic term for experience.\n")
cat("The relationship between experience and wages is NON-LINEAR.\n\n")

# Extract coefficients
exp_coef <- coef(model_e)["experience"]
exp_sq_coef <- coef(model_e)["experience_sq"]

cat("Experience coefficient:", round(exp_coef, 6), "\n")
cat("Experience squared coefficient:", round(exp_sq_coef, 6), "\n")

# Calculate the peak experience (where wage is maximized)
peak_experience <- -exp_coef / (2 * exp_sq_coef)
cat("\nWages peak at approximately", round(peak_experience, 1), "years of experience\n")

# Verify the math
cat("\nFormula: log(wage) = ", round(coef(model_e)[1], 4),
    " + ", round(coef(model_e)["education"], 4), "*education",
    " + ", round(exp_coef, 6), "*experience",
    " + ", round(exp_sq_coef, 6), "*experience^2",
    " + ", round(coef(model_e)["parttimeYes"], 4), "*parttime\n\n")

cat("WAGE-EXPERIENCE PROFILE:\n")
cat("- Starting (0 years experience): wages start at base level\n")
cat("- Each additional year of experience increases wages by",
    round(exp_coef*100, 3), "%\n")
cat("- BUT this effect DECREASES as experience increases (due to negative experience^2 term)\n")
cat("- After", round(peak_experience, 1), "years, additional experience DECREASES wages\n")
cat("- This captures the 'hump-shaped' wage-experience profile\n")

# Show wage profile at different experience levels
exp_levels <- c(0, 5, 10, 15, 20, 30, 40)
cat("\nPredicted log(wage) at different experience levels (holding other vars at mean):\n")

mean_education <- mean(CPS1988$education, na.rm = TRUE)
mean_parttime <- mean(as.numeric(CPS1988$parttime) - 1, na.rm = TRUE)  # Convert to 0/1

for(e in exp_levels) {
  pred_log_wage <- coef(model_e)[1] +
                   coef(model_e)["education"] * mean_education +
                   exp_coef * e +
                   exp_sq_coef * (e^2) +
                   coef(model_e)["parttimeYes"] * mean_parttime
  pred_wage <- exp(pred_log_wage)
  cat("Experience =", e, "years: log(wage) =", round(pred_log_wage, 4),
      ", wage = $", round(pred_wage, 2), "/hour\n")
}

# ==============================================================================
# SUMMARY TABLE OF ALL MODELS
# ==============================================================================
cat("\n\n======== SUMMARY OF ALL MODELS ========\n")
cat("\nModel A (Part-time effect):\n")
print(summary(model_a))

cat("\nModel B (Education * Part-time interaction):\n")
print(summary(model_b))

cat("\nModel C (Regional variation):\n")
print(summary(model_c))

cat("\nModel D (Education * Region interaction):\n")
print(summary(model_d))

cat("\nModel E (Experience quadratic):\n")
print(summary(model_e))

