import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
input_path = os.path.join(BASE_DIR, "data", "ConsumerPriceIndices_E_All_Data", "ConsumerPriceIndices_E_All_Data_NOFLAG.csv")
output_path = os.path.join(BASE_DIR, "data", "clean_consumer_price_indices.csv")


def clean_data():
    print(f"Reading {input_path}...")
    
    # Read the data, latin1 is often needed for FAOSTAT csv files
    df = pd.read_csv(input_path, encoding='latin1')
    
    # We want to keep Area, Item, Months, and the Year columns
    # We ignore Area Code, Item Code, Element Code, etc.
    year_cols = [col for col in df.columns if col.startswith('Y20')]
    keep_cols = ['Area', 'Item', 'Months'] + year_cols
    
    # Filter columns that are in the dataframe
    valid_cols = [c for c in keep_cols if c in df.columns]
    df = df[valid_cols]

    print("Melting data to transform years into rows...")
    # Melt the dataframe: from wide format (Years as columns) to long format (Year as a column)
    melted_df = pd.melt(
        df, 
        id_vars=['Area', 'Item', 'Months'], 
        value_vars=[c for c in year_cols if c in df.columns],
        var_name='Year', 
        value_name='Value'
    )
    
    # Clean the 'Year' column by removing the 'Y' prefix
    melted_df['Year'] = melted_df['Year'].str.replace('Y', '')
    
    # Remove rows where the Value is NaN (missing data)
    melted_df = melted_df.dropna(subset=['Value'])
    
    # Remove rows where 'Months' is something we can't parse easily if any 
    # FAO data might have 'Annual value', so let's keep only actual months if we want a monthly series.
    valid_months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']
    melted_df = melted_df[melted_df['Months'].isin(valid_months)]
    
    print("Formatting dates...")
    # Create a Date column
    # Combine Year and Month and parse it
    melted_df['Date'] = pd.to_datetime(melted_df['Year'] + ' ' + melted_df['Months'], format='%Y %B')
    
    # Sort the dataframe by Area, Item, Date for a clean timeseries structure
    melted_df = melted_df.sort_values(by=['Area', 'Item', 'Date'])
    
    # Reorder columns
    final_cols = ['Date', 'Area', 'Item', 'Value']
    melted_df = melted_df[final_cols]
    
    print("Data structure after cleaning:")
    print(melted_df.info())
    print("\nFirst 5 rows:")
    print(melted_df.head())
    
    # Save the cleaned dataset
    melted_df.to_csv(output_path, index=False)
    print(f"\nSuccessfully cleaned and saved dataset to: {output_path}")

if __name__ == "__main__":
    clean_data()
