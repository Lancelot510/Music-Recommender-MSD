import streamlit as st
import random

# Sample songs (replace with your song data)
songs = [
    {"title": "Be a Brother", "artist": "Big Brother & The Holding Company", "loudness": 0.6, "tempo": 120, "energy": 0.8, "hotness": 0.9},
    {"title": "Friend or Foe", "artist": "Adam Ant", "loudness": 0.5, "tempo": 100, "energy": 0.1, "hotness": 0.2},
    {"title": "Colours", "artist": "Son Kite", "loudness": 0.3, "tempo": 135, "energy": 0.2, "hotness": 0.5},
    {"title": "Bring ya to the Brink", "artist": "Cyndi Lauper", "loudness": 0.7, "tempo": 60, "energy": 0.9, "hotness": 0.8},
    {"title": "The Mushroom Tapes", "artist": "The Flaming Lips", "loudness": 0.4, "tempo": 150, "energy": 0.4, "hotness": 0.4},
    # {"title": "Song 6", "artist": "Artist 3", "loudness": 0.1, "tempo": 79, "energy": 0.6, "hotness": 0.3},
    # {"title": "Song 7", "artist": "Artist 6", "loudness": 0.8, "tempo": 65, "energy": 0.1, "hotness": 0.2},
    # {"title": "Song 8", "artist": "Artist 3", "loudness": 0.8, "tempo": 80, "energy": 0.95, "hotness": 0.1}
    # Add more song data
]

# Sample similar songs (you can replace this with your own logic to find similar songs)
similar_songs = {
    "Be a Brother": ["Friend or Foe", "Colours"],
    "Colours": ["Be a Brother", "Bring ya to the Brink", "The Mushroom Tapes"],
    "Bring ya to the Brink": ["Tangram","After the rain"],
    "Friend or Foe": ["Miss Machine", "Favors"],
    # "Song 5": ["Song 2"],
    # "Song 6": ["Song 3"],
    # "Song 7": [],
    # "Song 8": [],
}



st.markdown("""
    <style>
        div.stButton > button:first-child {
            padding: 12px 24px;
            border-radius: 8px;
            background-color: #3498db;
            color: white;
            font-size: 16px;
        }
    </style>
            """, unsafe_allow_html=True)


# Streamlit app layout
st.title("Music Recommender")

# Select options using checkboxes and sliders
st.sidebar.header("Song Features:")
loudness_option = st.sidebar.checkbox("Loudness", True)
if loudness_option:
    loudness_slider = st.sidebar.slider("Loudness Threshold", min_value=0.0, max_value=1.0, value=0.5)
tempo_option = st.sidebar.checkbox("Tempo", False)
if tempo_option:
    tempo_slider = st.sidebar.slider("Tempo Threshold", min_value=0, max_value=200, value=100)
energy_option = st.sidebar.checkbox("Energy", False)
if energy_option:
    energy_slider = st.sidebar.slider("Energy Threshold", min_value=0.0, max_value=1.0, value=0.5)
hotness_option = st.sidebar.checkbox("Hotness", False)
if hotness_option:
    hotness_slider = st.sidebar.slider("Hotness Threshold", min_value=0.0, max_value=1.0, value=0.5)

# Number of recommendations
num_recommendations = st.number_input("Number of Recommendations", min_value=0, max_value=len(songs), value=3)

# Generate song recommendations
if st.button("Generate Recommendations"):
    if num_recommendations > 0:
        # Filter songs based on selected options and sliders
        filtered_songs = []
        for song in songs:
            if (not loudness_option or song["loudness"] >= loudness_slider) and \
               (not tempo_option or song["tempo"] <= tempo_slider) and \
               (not energy_option or song["energy"] >= energy_slider) and \
               (not hotness_option or song["hotness"] >= hotness_slider):
                filtered_songs.append(song)

        if len(filtered_songs) < num_recommendations:
            st.warning("Not enough songs to meet the recommendation count.")
            num_recommendations = len(filtered_songs)

        recommendations = random.sample(filtered_songs, num_recommendations)
        st.subheader("Recommendations:")

        # Create a grid layout for recommendations
        # columns = st.columns(len(recommendations))

        for i, song in enumerate(recommendations):
            title = song["title"]
            artist = song["artist"]
            background_color = "#48E5C2"  # Change this to your desired background color

        # with columns[i]:
            # Define the background color and style for each tile
                
            st.markdown(
                f'<div style="background-color: {background_color}; padding: 10px; border: 1px solid #333333; border-radius: 10px;">'
                f'<h3>{title} - {artist}</h3>'
                # f'{"Loudness: " + str(song["loudness"]) if loudness_option else ""}'
                # f'{"Tempo: " + str(song["tempo"]) if tempo_option else ""}'
                # f'{"Energy: " + str(song["energy"]) if energy_option else ""}'
                # f'{"Hotness: " + str(song["hotness"]) if hotness_option else ""}'
                f'</div>', unsafe_allow_html=True)
            
            # Add a button after each similar song title
            button_key = f"like_button_{i}"
            if st.button("I like this song!",key=button_key):
                st.write(f"You liked {title}!")


            # Display similar songs in an expander
            if title in similar_songs:
                with st.expander("You might also like:"):
                    for similar_song in similar_songs[title]:
                        st.write(similar_song)
                        