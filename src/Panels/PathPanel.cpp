#include "pch.h"
#include "Panels/PathPanel.h"

#include "Helpers/ConsoleStore.h"
#include "Helpers/LocationMover.h"
#include "Helpers/Utils.h"
#include "Render/UI.h"
#include "Render/TextureMap.h"

PathPanel::PathPanel()
{
    std::string textureName = "leftArrow";

    if (!TextureMap::TextureExists(textureName))
        TextureMap::AddTexture(textureName, Utils::GetExecDir() / "assets" / "icons" / (textureName + ".png"));

    m_PathNodes.emplace_back("OpenNeighborhood", std::string::npos, this);
}

void PathPanel::OnRender()
{
    ImGuiWindowFlags windowFlags =
        ImGuiWindowFlags_NoTitleBar |
        ImGuiWindowFlags_NoCollapse |
        ImGuiWindowFlags_NoResize |
        ImGuiWindowFlags_NoMove |
        ImGuiWindowFlags_NoBringToFrontOnFocus |
        ImGuiWindowFlags_NoNavFocus |
        ImGuiWindowFlags_HorizontalScrollbar;

    float width = m_WindowWidth - m_Margin * 2.0f;
    float height = m_Margin * 2.4f;

    ImGui::SetNextWindowPos(ImVec2(m_Margin, m_Margin));
    ImGui::SetNextWindowSize(ImVec2(width, height));

    ImGui::Begin("Path Window", nullptr, windowFlags);
    ImGui::PushFont(UI::GetRegularBigFont());

    m_GoToParentButton.OnRender();

    ImGui::SameLine();
    ImGui::TextUnformatted("");

    ImGuiStyle &style = ImGui::GetStyle();
    ImVec4 &borderColor = style.Colors[ImGuiCol_Border];
    auto texture = TextureMap::GetTexture(m_GoToParentButton.GetTextureName());
    float lineX = m_Margin + static_cast<float>(texture->GetWidth()) + style.ItemSpacing.x * 3.0f;
    ImDrawList *drawList = ImGui::GetWindowDrawList();
    drawList->AddLine(
        ImVec2(lineX, m_Margin),
        ImVec2(lineX, m_Margin + height),
        IM_COL32(borderColor.x * 255.0f, borderColor.y * 255.0f, borderColor.z * 255.0f, borderColor.w * 255.0f)
    );

    ImGui::SameLine();

    for (size_t i = 0; i < m_PathNodes.size(); i++)
    {
        ImGui::PushID(static_cast<int>(i));

        m_PathNodes[i].OnRender();

        // Render all PathNodes on the same line and add a '>' between them
        if (i + 1 < m_PathNodes.size())
        {
            ImGui::SameLine();
            ImGui::TextUnformatted(">");
            ImGui::SameLine();
        }

        ImGui::PopID();
    }

    ImGui::PopFont();
    ImGui::End();

    if (!m_ContentsChangeEventQueue.empty())
    {
        UpdateDirectories();
        m_ContentsChangeEventQueue.pop();
    }
}

void PathPanel::OnEvent(Event &event)
{
    Panel::OnEvent(event);

    EventDispatcher dispatcher(event);
    dispatcher.Dispatch<ContentsChangeEvent>(BIND_EVENT_FN(PathPanel::OnCurrentXboxLocationChange));
}

bool PathPanel::OnCurrentXboxLocationChange(ContentsChangeEvent &event)
{
    m_ContentsChangeEventQueue.push(event);

    return true;
}

void PathPanel::UpdateDirectories()
{
    m_PathNodes.erase(m_PathNodes.begin() + 1, m_PathNodes.end());

    // If the current app location is at the drive list or further (inside of a drive),
    // add a PathNode with the console name
    if (LocationMover::GetCurrentAppLocation() >= LocationMover::AppLocation::DriveList)
        m_PathNodes.emplace_back(ConsoleStore::GetConsole().GetName(), std::string::npos, this);

    if (LocationMover::GetCurrentAppLocation() < LocationMover::AppLocation::DriveContents)
        return;

    const XBDM::XboxPath &consoleLocation = LocationMover::GetCurrentConsoleLocation();

    std::vector<std::string> directories = Utils::StringSplit(consoleLocation.String(), "\\");
    for (auto &directory : directories)
        m_PathNodes.emplace_back(directory, m_PathNodes.size(), this);
}
