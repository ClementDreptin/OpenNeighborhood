#include "pch.h"
#include "Elements/AddXboxButton.h"

#include "Render/TextureMap.h"
#include "Helpers/ConsoleStore.h"
#include "Helpers/ConfigManager.h"
#include "Events/AppEvent.h"
#include "Elements/Xbox.h"
#include "Render/UI.h"

AddXboxButton::AddXboxButton()
    : Element("Add Xbox 360", "addXboxButton")
{
}

void AddXboxButton::OnRender()
{
    auto texture = TextureMap::GetTexture(m_TextureName);

    if (ImGui::ImageButtonWithText(reinterpret_cast<void *>(static_cast<intptr_t>(texture->GetTextureID())), ImVec2(texture->GetWidth(), texture->GetHeight()), ImVec2(m_Width, m_Height), m_Label.c_str(), ImVec2(m_Padding, m_Padding)))
        if (ImGui::IsMouseDoubleClicked(ImGuiMouseButton_Left))
            OnClick();

    ImVec2 center(ImGui::GetIO().DisplaySize.x * 0.5f, ImGui::GetIO().DisplaySize.y * 0.5f);
    ImGui::SetNextWindowPos(center, ImGuiCond_Appearing, ImVec2(0.5f, 0.5f));

    if (ImGui::BeginPopupModal("Add Xbox 360?", nullptr, ImGuiWindowFlags_AlwaysAutoResize))
    {
        static int bytes[4] = { 192, 168, 1, 100 };

        float width = ImGui::CalcItemWidth();
        ImGui::PushID("IP");
        ImGui::TextUnformatted("IP Address");
        ImGui::SameLine();
        for (int i = 0; i < 4; i++)
        {
            ImGui::PushItemWidth(width / 4.0f);
            ImGui::PushID(i);
            bool invalidByte = false;

            if (bytes[i] > 255)
            {
                // Make values over 255 red, and when focus is lost reset it to 255.
                bytes[i] = 255;
                invalidByte = true;
                ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(1.0f, 0.0f, 0.0f, 1.0f));
            }
            else if (bytes[i] < 0)
            {
                // Make values below 0 yellow, and when focus is lost reset it to 0.
                bytes[i] = 0;
                invalidByte = true;
                ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(1.0f, 1.0f, 0.0f, 1.0f));
            }

            // We set the step and step_fast to 0 to remove the '-' and '+' button to the right of each int input
            ImGui::InputInt("##v", &bytes[i], 0, 0, ImGuiInputTextFlags_CharsDecimal);

            if (invalidByte)
                ImGui::PopStyleColor();

            // Call ImGui::SameLine() only for the first 3 inputs
            if (i < 3)
                ImGui::SameLine();

            ImGui::PopID();
            ImGui::PopItemWidth();
        }

        ImGui::PopID();

        if (ImGui::Button("OK", ImVec2(120.0f, 0.0f)))
        {
            std::stringstream ipAddress;
            ipAddress << bytes[0] << "." << bytes[1] << "." << bytes[2] << "." << bytes[3];

            UI::SetSuccess(ConsoleStore::CreateConsole(ipAddress.str()));

            if (UI::IsGood())
                CreateXbox(ConsoleStore::GetConsole().GetName(), ipAddress.str());
            else
                UI::SetErrorMessage("Couldn't find console");

            ImGui::CloseCurrentPopup();
        }

        ImGui::SetItemDefaultFocus();
        ImGui::SameLine();

        if (ImGui::Button("Cancel", ImVec2(120, 0)))
            ImGui::CloseCurrentPopup();

        ImGui::EndPopup();
    }
}

void AddXboxButton::OnClick()
{
    ImGui::OpenPopup("Add Xbox 360?");
}

void AddXboxButton::CreateXbox(const std::string &xboxName, const std::string &ipAddress)
{
    auto elements = std::vector<Ref<Element>>();
    Xbox xbox(xboxName, ipAddress);

    elements.emplace_back(CreateRef<Xbox>(xbox));

    ContentsChangeEvent event(elements, true);
    m_EventCallback(event);

    ConfigManager::AddXbox(xbox);
}
