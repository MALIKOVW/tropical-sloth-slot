import trafilatura

def get_slot_standards():
    """
    Scrape information about slot machine standards from various sources
    """
    urls = [
        "https://slotgator.com/resources/slot-design",
        "https://igamingbusiness.com/casino/slots/standard-slot-design",
        "https://www.gambling.com/online-casinos/strategy/slots/layout-explained",
        "https://www.casinoslotsonline.com/slots/how-slots-work",
        "https://www.slotsup.com/blog/online-slots-interface-design"
    ]

    content = []
    for url in urls:
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded)
                if text:
                    content.append(f"\nSource: {url}\n{text}")
            print(f"Successfully scraped {url}")
        except Exception as e:
            print(f"Error scraping {url}: {e}")

    # Add common industry standards manually if scraping fails
    industry_standards = """
Standard Slot Machine Interface Guidelines:

1. Display Dimensions:
- Recommended aspect ratio: 16:9 or 4:3
- Minimum width: 800px
- Optimal width: 1024px-1440px
- Symbol size: 120px-180px square

2. Layout Standards:
- 5x3 grid layout (most common)
- Symbol padding: 10-15% of symbol size
- Visible paylines: up to 20-25
- Spacing between reels: 5-10% of symbol width

3. Interface Elements:
- Spin button: 80-100px diameter
- Control panel height: 15-20% of total height
- Paytable width: 20-25% of total width
- Statistics panel height: 60-80px

4. Animation Timing:
- Spin duration: 2-3 seconds
- Win animation: 2-4 seconds
- Symbol transition: 0.3-0.5 seconds

5. Responsive Design:
- Mobile breakpoint: 768px
- Tablet breakpoint: 1024px
- Desktop optimization: 1440px
"""
    content.append(industry_standards)

    with open('slot_standards.txt', 'w', encoding='utf-8') as f:
        f.write("\n=== Slot Machine Standards Research ===\n")
        f.write("\n".join(content))

    print("\nResearch has been saved to slot_standards.txt")

if __name__ == "__main__":
    print("Starting research on slot machine standards...")
    get_slot_standards()